// Migration to create tasks table
exports.up = function (knex) {
    return knex.schema.createTable('tasks', function (table) {
        table.increments('id').primary();
        table.string('title', 200).notNullable();
        table.text('description');
        table.integer('team_id').unsigned().notNullable();
        table.integer('assigned_to').unsigned();
        table.integer('created_by').unsigned().notNullable();
        table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
        table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
        table.date('due_date');
        table.timestamps(true, true);

        // Foreign key constraints
        table.foreign('team_id').references('teams.id').onDelete('CASCADE');
        table.foreign('assigned_to').references('users.id').onDelete('SET NULL');
        table.foreign('created_by').references('users.id').onDelete('CASCADE');

        // Indexes for filtering and searching
        table.index('team_id');
        table.index('assigned_to');
        table.index('status');
        table.index('due_date');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('tasks');
};
