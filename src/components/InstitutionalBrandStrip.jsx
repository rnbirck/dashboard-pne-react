import { InstitutionalLogo } from './InstitutionalLogo'

export function InstitutionalBrandStrip() {
  return (
    <section className="institutional-brand-strip" aria-labelledby="institutional-brand-strip-title">
      <div className="institutional-brand-strip__copy">
        <span id="institutional-brand-strip-title">Realização institucional</span>
        <p>Leitura municipal organizada a partir de fontes oficiais e compromisso com a educação pública.</p>
      </div>
      <div className="institutional-brand-strip__logos" aria-label="Marcas institucionais">
        <InstitutionalLogo alt="Logo do SESI-RS" src="/brands/SESI.png" />
        <InstitutionalLogo alt="Logo da FIERGS" src="/brands/FIERGS.png" />
      </div>
    </section>
  )
}
