import jwt from "jsonwebtoken";

const token = jwt.sign(
  {
    userId: "6a54b91d8dfa1f09efdbc9ae",
    email: "super_admin@trustshield.io",
    role: "SUPER_ADMIN"
  },
  "change_me_access",
  { expiresIn: "1y" }
);
console.log(token);
