import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model';
import { Patient } from '../models/patient.model';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/callback/google',
    },
async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({googleId: profile.id});
            if(!user) {
                user = await User.create({
                    googleId: profile.id,
                    fullName: profile.displayName,
                    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
                    emailVerified: true,
                    role: 'patient',
                });
                await Patient.create({userId: user._id})
            }
            return done(null, user);
        }catch(error) {
            console.error('Error during Google authentication:', error);
            return done(error, undefined);
        }
    }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});