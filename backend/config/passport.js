const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

// Configure the local strategy for use by Passport
passport.use(new LocalStrategy(
    async function (username, password, done) {
        try {
            // Find user by username
            const user = await db('users')
                .where({ username })
                .first();

            // Check if user exists
            if (!user) {
                return done(null, false, { message: 'Incorrect username or password' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                return done(null, false, { message: 'Incorrect username or password' });
            }

            // Authentication successful
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize user for the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async function (id, done) {
    try {
        const user = await db('users')
            .where({ id })
            .first();

        if (!user) {
            return done(new Error('User not found'));
        }

        // Remove password hash before returning user
        delete user.password_hash;
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
