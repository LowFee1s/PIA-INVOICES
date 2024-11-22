import Logo from '@/app/Logo.png'
import Image from 'next/image';

export default function AcmeLogo() {
  return (
      <Image src={Logo} alt="Imagen representativa del logo de la empresa" />
  );
}
