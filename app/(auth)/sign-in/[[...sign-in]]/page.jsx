import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <section className="bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
        <section className="relative flex h-64 lg:h-full items-end bg-gray-900 lg:col-span-5 xl:col-span-6">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1617195737496-bc30194e3a19?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />

          <div className="relative p-4 sm:p-8 lg:p-12 hidden lg:block">
            <a className="block text-white" href="#">
              <span className="sr-only">Home</span>
              <svg
                className="h-8 sm:h-10"
                viewBox="0 0 28 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* SVG path here */}
              </svg>
            </a>

            <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Welcome to PrepTalk
            </h2>

            <p className="mt-4 leading-relaxed text-white/90">
              "AI-Powered Interviews: Master Full Stack, One Question at a Time"
            </p>
          </div>
        </section>

        <main className="flex items-center justify-center px-4 py-8 sm:px-8 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-lg lg:max-w-3xl">
            <div className="relative block lg:hidden -mt-16">
              <a
                className="inline-flex items-center justify-center rounded-full bg-white text-blue-600 h-16 w-16 sm:h-20 sm:w-20"
                href="#"
              >
                <span className="sr-only">Home</span>
                <svg
                  className="h-8 sm:h-10"
                  viewBox="0 0 28 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG path here */}
                </svg>
              </a>

              <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
                Welcome to PrepTalk
              </h1>

              <p className="mt-4 leading-relaxed text-gray-500">
                "AI-Powered Interviews: Master Full Stack, One Question at a Time"
              </p>
            </div>

            <SignIn />
          </div>
        </main>
      </div>
    </section>
  );
}
