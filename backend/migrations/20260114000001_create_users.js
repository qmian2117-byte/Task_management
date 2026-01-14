// Migration to create users table
exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
        table.increments('id').primary();
        table.string('username', 50).notNullable().unique();
        table.string('email', 100).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.timestamps(true, true);

        // Add indexes for better query performance
        table.index('username');
        table.index('email');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
