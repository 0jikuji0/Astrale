import { Link } from "react-router";

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center items-center pointer-events-none">
      <div className="w-full backdrop-blur-md bg-blue-900/20 border-b border-white/20 py-3 px-6 pointer-events-auto">
        <div className="flex justify-between items-center">
          <div className="text-white text-lg font-semibold">MySite</div>
          <div className="flex gap-8">
            {["Home", "Features", "About", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white hover:text-yellow-300 transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>
          <div>
            <Link
              to=""
              className="text-white hover:text-yellow-300 transition-colors duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
