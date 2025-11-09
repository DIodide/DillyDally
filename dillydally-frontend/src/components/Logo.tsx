export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Computer Monitor with Eyes */}
      <svg
        width="50"
        height="50"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#17a2b8]"
      >
        {/* Monitor body */}
        <rect x="10" y="30" width="80" height="50" rx="5" stroke="currentColor" strokeWidth="4" fill="white" />
        
        {/* Monitor stand */}
        <rect x="40" y="80" width="20" height="5" fill="currentColor" />
        <rect x="30" y="85" width="40" height="3" fill="currentColor" />
        
        {/* Left eye */}
        <circle cx="35" cy="50" r="8" fill="currentColor" />
        <circle cx="35" cy="48" r="3" fill="white" />
        <circle cx="36" cy="47" r="1.5" fill="black" />
        
        {/* Right eye */}
        <circle cx="65" cy="50" r="8" fill="currentColor" />
        <circle cx="65" cy="48" r="3" fill="white" />
        <circle cx="66" cy="47" r="1.5" fill="black" />
        
        {/* Eyebrows */}
        <path d="M 27 38 Q 35 35 43 38" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 57 38 Q 65 35 73 38" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      
      <h1 className="text-3xl font-bold text-[#17a2b8]" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
        DillyDally
      </h1>
    </div>
  );
}


