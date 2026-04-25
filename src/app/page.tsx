import Link from "next/link";
import { HalloweenMap } from "@/app/components/halloween-map";
import { getHalloweenData } from "@/lib/store";

export default async function Home() {
  const data = await getHalloweenData();
  const total = data.participants.reduce((sum, participant) => sum + participant.count, 0);

  return (
    <main className="page">
      <section className="hero">
        <div className="web web-left" aria-hidden="true" />
        <div className="web web-right" aria-hidden="true" />
        <p className="eyebrow">Croquis vecinal y ruta de dulces</p>
        <h1>Halloween Alzare 2026</h1>
        <p className="hero-copy">
          Casas participantes, avisos y reglas para una noche divertida y ordenada en la colonia.
        </p>
        <div className="stats">
          <span>{data.participants.length} casas</span>
          <span>{total} participantes</span>
          <span>🎃 casa participante</span>
        </div>
      </section>

      <HalloweenMap participants={data.participants} />

      <section className="content-grid">
        <article className="info-panel">
          <h2>Noticias</h2>
          <ul>
            {data.content.news.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="info-panel">
          <h2>Reglas</h2>
          <ul>
            {data.content.rules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <footer>
        <Link href="/login">Solo administradores</Link>
      </footer>
    </main>
  );
}
