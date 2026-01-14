// Migration to create team_members junction table
exports.up = function (knex) {
    return knex.schema.createTable('team_members', function (table) {
        table.increments('id').primary();
        table.integer('team_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.enum('role', ['creator', 'member']).defaultTo('member');
        table.timestamp('joined_at').defaultTo(knex.fn.now());

        // Foreign key constraints
        table.foreign('team_id').references('teams.id').onDelete('CASCADE');
        table.foreign('user_id').references('users.id').onDelete('CASCADE');

        // Unique constraint to prevent duplicate memberships
        table.unique(['team_id', 'user_id']);

        // Indexes for faster queries
        table.index('team_id');
        table.index('user_id');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('team_members');
};
