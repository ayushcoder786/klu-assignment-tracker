package com.klu.assignmenttracker.config;

import com.mongodb.client.MongoClient;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.health.contributor.AbstractHealthIndicator;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthContributor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Overrides Spring Boot 4.x's default MongoDB health contributor.
 *
 * <p>The auto-configured {@code MongoHealthIndicator} in spring-boot-mongodb 4.1.0
 * calls {@code mongoClient.listDatabaseNames()} and then runs the {@code hello}
 * command against every database it finds — including MongoDB's internal
 * {@code local} database. MongoDB Atlas blocks the {@code local} database for all
 * application users, so the default health check always fails with:
 * <pre>
 *   (Unauthorized) not authorized on local to execute command { hello: 1, $db: "local" }
 * </pre>
 *
 * <p>This bean is named {@code mongoHealthContributor} to match the conditional in
 * {@code MongoHealthContributorAutoConfiguration} so it prevents the broken
 * auto-configured one from being registered.
 *
 * <p>The replacement runs {@code ping} only against the configured application
 * database, which the application user is always authorised to access.
 */
@Configuration
public class MongoHealthConfig {

    /**
     * Replaces the auto-configured MongoDB health contributor.
     *
     * <p>Uses {@code ping} instead of {@code hello} and checks only the
     * application database, never the {@code local} system database that
     * Atlas restricts.
     *
     * @param mongoClient  the auto-configured Atlas MongoClient
     * @param databaseName the application database name (from spring.mongodb.database)
     */
    @Bean("mongoHealthContributor")
    public HealthContributor mongoHealthContributor(
            MongoClient mongoClient,
            @Value("${spring.mongodb.database:klu_assignment_tracker}") String databaseName) {

        return new AbstractHealthIndicator("MongoDB health check failed") {
            @Override
            protected void doHealthCheck(Health.Builder builder) throws Exception {
                // Use 'ping' — requires no special permissions and works on any
                // MongoDB version. We only check the application database, never
                // 'local' (a system database that Atlas blocks for app users).
                Document result = mongoClient
                        .getDatabase(databaseName)
                        .runCommand(Document.parse("{ ping: 1 }"));
                builder.up()
                        .withDetail("database", databaseName)
                        .withDetail("ok", result.get("ok"));
            }
        };
    }
}
