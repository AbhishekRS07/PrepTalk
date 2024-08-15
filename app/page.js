"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-3xl">
        <div className="relative h-56">
          <Image
            src="/interview.png" // Ensure the image is placed in the 'public' folder
            alt="Interview"
            fill
            style={{ objectFit: "cover" }} // Replaces objectFit="cover"
          />
        </div>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-800">AI Mock Interview</h1>
          <p className="mt-4 text-gray-600">
            Prepare for your interviews with the power of AI! AI Mock Interview
            uses advanced Gemini AI technology to simulate real interview
            scenarios and help you master your skills.
          </p>
          <p className="mt-2 text-gray-600">
            Whether you're preparing for technical interviews or improving your
            soft skills, AI Mock Interview is here to support your journey to
            success.
          </p>
          <button
            onClick={handleRedirect}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition duration-200"
          >
           Click here to start your journey!
          </button>
        </div>
      </div>
    </div>
  );
}
