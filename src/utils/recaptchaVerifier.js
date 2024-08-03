const verifyCaptcha = async (token) => {
  try {
    const response = await fetch(process.env.G_RECAPTCHA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.G_RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    const { score, action, success } = data || {};
    if (success && score >= 0.5 && action === "submit") {
      return true;
    }
  } catch (error) {
    console.error("Error during reCAPTCHA verification:", error);
  }
  return false;
};

module.exports = verifyCaptcha;
