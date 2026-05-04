export const Header = () => {
  return (
    <header className="py-5 px-6 bg-white border-b border-gray-300 flex justify-between items-center">
      <h1 className="text-xl font-extrabold text-[#2663EB]">VISUAL POSTURE MANAGER</h1>
      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="font-medium text-gray-500">AI VISION READY</span>
        </div>
        <button className="bg-[#F1F5F9] px-4 py-2 rounded-lg text-sm font-bold text-[#5D628A]">통계 보기</button>
      </div>
    </header>
  );
};
