// ✅ FILE: client/src/pages/SignUp.jsx
function SignUp() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form>
        <input
          className="block w-full p-2 border mb-2"
          type="email"
          placeholder="Email"
        />
        <input
          className="block w-full p-2 border mb-2"
          type="text"
          placeholder="Username"
        />
        <input
          className="block w-full p-2 border mb-2"
          type="password"
          placeholder="Password"
        />
        <input
          className="block w-full p-2 border mb-4"
          type="password"
          placeholder="Confirm Password"
        />
        <button className="bg-green-600 text-white px-4 py-2">Register</button>
      </form>
    </div>
  );
}

export default SignUp;
