import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model";
import { Patient } from "../models/patient.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/callback/google",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const displayName = profile.displayName;
        let existingUser = await User.findOne({ email });

        if (!existingUser) {
          existingUser = await User.create({
            email,
            fullName: displayName,
            role: "patient", // hoặc giá trị phù hợp
          });
        }
        let existingPatient = await Patient.findOne({
          userId: existingUser._id,
        });

        if (!existingPatient) {
          existingPatient = new Patient({
            userId: existingUser._id,
            // patientCode sẽ được tạo tự động qua pre('save')
          });

          await existingPatient.save();
        }

        return done(null, existingUser);
      } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error, undefined);
      }
    }
  )
);

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
