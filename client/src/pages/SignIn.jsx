// ✅ FILE: client/src/pages/SignIn.jsx
function SignIn() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form>
        <input
          className="block w-full p-2 border mb-2"
          type="email"
          placeholder="Email"
        />
        <input
          className="block w-full p-2 border mb-2"
          type="password"
          placeholder="Password"
        />
        <button className="bg-blue-500 text-white px-4 py-2">Sign In</button>
      </form>
    </div>
  );
}

export default SignIn;
