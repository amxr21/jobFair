const SignupText = () => {
    return (
      <div className="font-bold w-[42rem] text-white rounded-2xl p-10">
        <h2 className="font-bold text-5xl leading-[3.5rem] mb-6">
          Welcome to the Internship & Career Fair 2025 Portal!
        </h2>
        <p className="text-lg font-light text-justify">
          Register your company to access full features and connect with potential candidates.
        </p>
        <div className="mt-10 text-base font-light">
          <span>Already have an account? </span>
          <a href="/login" className="underline">
            Log in here
          </a>
        </div>
      </div>
    );
  };
  
  export default SignupText;
  