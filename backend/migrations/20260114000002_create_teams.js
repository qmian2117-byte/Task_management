// Migration to create teams table
exports.up = function (knex) {
    return knex.schema.createTable('teams', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.text('description');
        table.integer('created_by').unsigned().notNullable();
        table.timestamps(true, true);

        // Foreign key constraint
        table.foreign('created_by').references('users.id').onDelete('CASCADE');

        // Index for creator lookup
        table.index('created_by');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('teams');
};
