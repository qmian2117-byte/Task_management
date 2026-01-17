// Passport.js configuration for local authentication
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('./database');

// Configure local strategy
passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    async (username, password, done) => {
        try {
            // Find user by username
            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            const user = users[0];

            // Compare password with hash
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            // Authentication successful
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return done(null, false);
        }

        done(null, users[0]);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
