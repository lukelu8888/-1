import cosunSquareLogo from '../../assets/262d7b2c13569c77ce921a39b3150003bd6f7975.png';

interface HeaderLogoProps {
  onNavigateHome: () => void;
}

export function HeaderLogo({ onNavigateHome }: HeaderLogoProps) {
  return (
    <button
      onClick={onNavigateHome}
      className="group flex w-[230px] flex-shrink-0 items-center gap-3 rounded-md pr-2 text-left leading-none transition hover:bg-red-50/70"
      aria-label="Go to COSUN home"
    >
      <img
        src={cosunSquareLogo}
        alt="COSUN"
        className="h-[60px] w-[60px] flex-shrink-0 object-contain"
      />
      <span className="min-w-0">
        <span className="block font-serif text-[34px] font-black leading-[0.82] tracking-tight text-red-600">COSUN</span>
        <span className="mt-2 block text-xs font-semibold uppercase tracking-widest text-gray-700">
          Global Trade & Supply
        </span>
      </span>
    </button>
  );
}
