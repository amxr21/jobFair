const AuthText = ({ variant = "login" }) => {
  const content = {
    login: {
      description: "Use the credentials shared with you via email to access the participants of the event"
    },
    signup: {
      description: "Register your company to access full features and connect with potential candidates."
    }
  };

  const { description } = content[variant] || content.login;

  return (
    <div className="flex flex-col justify-center text-center md:text-left text-white shrink-0 transition-all duration-300 ease-in-out">
      <h2 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight md:leading-snug mb-2 md:mb-4 transition-all duration-300 ease-in-out">
        Welcome to the Internship & Career Fair 2025 Portal!
      </h2>
      <p className="text-sm md:text-base lg:text-lg font-light opacity-90 transition-all duration-300 ease-in-out">
        {description}
      </p>
    </div>
  );
};

export default AuthText;
