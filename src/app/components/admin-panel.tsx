import { deleteParticipantAction, saveContentAction, upsertParticipantAction } from "@/app/actions";
import { HalloweenMap } from "@/app/components/halloween-map";
import { allHouseNumbers } from "@/lib/map-data";
import type { HalloweenData } from "@/lib/types";

export function AdminPanel({ data, username }: { data: HalloweenData; username: string }) {
  return (
    <main className="page admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel de administracion</p>
          <h1>Halloween Alzare 2026</h1>
          <p>Sesion activa: {username}</p>
        </div>
        <a className="ghost-link" href="/">
          Ver pagina publica
        </a>
      </header>

      <HalloweenMap participants={data.participants} admin />

      <section className="admin-grid">
        <form className="panel" action={upsertParticipantAction}>
          <h2>Alta o modificacion</h2>
          <label>
            Casa
            <select name="houseNumber" required>
              {allHouseNumbers.map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>
          <label>
            Participantes
            <input name="count" type="number" min="1" max="99" defaultValue="1" required />
          </label>
          <label>
            Nota
            <input name="note" placeholder="Ej. dulces, decoracion, horario" />
          </label>
          <button type="submit">Guardar casa</button>
        </form>

        <form className="panel" action={saveContentAction}>
          <h2>Noticias y reglas</h2>
          <label>
            Noticias
            <textarea name="news" rows={5} defaultValue={data.content.news.join("\n")} />
          </label>
          <label>
            Reglas
            <textarea name="rules" rows={5} defaultValue={data.content.rules.join("\n")} />
          </label>
          <button type="submit">Actualizar contenido</button>
        </form>

        <section className="panel participants-list">
          <h2>Participantes</h2>
          {data.participants.map((participant) => (
            <form action={deleteParticipantAction} className="participant-row" key={participant.houseNumber}>
              <input type="hidden" name="houseNumber" value={participant.houseNumber} />
              <span>
                <strong>Casa {participant.houseNumber}</strong>
                <small>{participant.count} participante(s)</small>
              </span>
              <button type="submit" className="danger">
                Borrar
              </button>
            </form>
          ))}
        </section>
      </section>
    </main>
  );
}
