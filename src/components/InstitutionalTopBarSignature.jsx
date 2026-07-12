import { InstitutionalLogo } from './InstitutionalLogo'

export function InstitutionalTopBarSignature() {
  return (
    <div className="institutional-top-signature" aria-label="Marcas institucionais">
      <InstitutionalLogo alt="SESI-RS" src="/brands/SESI.png" />
      <InstitutionalLogo alt="FIERGS" src="/brands/FIERGS.png" />
    </div>
  )
}
