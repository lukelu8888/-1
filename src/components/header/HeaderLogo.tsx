import logoImg from 'figma:asset/9a3a6ac3157cb3341dbd6e007c72e203e4dda5ea.png';

interface HeaderLogoProps {
  onNavigateHome: () => void;
}

export function HeaderLogo({ onNavigateHome }: HeaderLogoProps) {
  return (
    <button onClick={onNavigateHome} className="flex-shrink-0">
      <img
        src={logoImg}
        alt="COSUN Logo"
        className="w-auto"
        style={{ height: '70.4px' }}
      />
    </button>
  );
}
