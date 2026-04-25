import { mapBlocks } from "@/lib/map-data";
import type { Participant } from "@/lib/types";

type Props = {
  participants: Participant[];
  admin?: boolean;
};

export function HalloweenMap({ participants, admin = false }: Props) {
  const participantByHouse = new Map(participants.map((participant) => [participant.houseNumber, participant]));
  const upperBlocks = mapBlocks.slice(0, 5);
  const lowerBlocks = mapBlocks.slice(5);

  return (
    <section className="map-shell" aria-label="Croquis Halloween Alzare">
      <div className="croquis-board">
        <div className="horizontal-street street-57">CALLE 57</div>
        <div className="horizontal-street street-57b">CALLE 57B</div>
        <div className="horizontal-street street-59">CALLE 59</div>
        <div className="vertical-street street-82">CALLE 82</div>
        <div className="vertical-street street-80a">CALLE 80A</div>
        <div className="vertical-street street-80">CALLE 80</div>
        <div className="vertical-street street-78a">CALLE 78A</div>
        <div className="vertical-street street-78">CALLE 78</div>
        <div className="vertical-street street-76a">CALLE 76A</div>

        <div className="block-grid top-neighborhood">
          {upperBlocks.map((block) => (
            <article className="map-block" key={block.id}>
              <HouseRow houses={block.top} participantByHouse={participantByHouse} admin={admin} />
              <div className="block-yard" aria-hidden="true" />
              <HouseRow houses={block.bottom} participantByHouse={participantByHouse} admin={admin} />
            </article>
          ))}
        </div>

        <div className="block-grid middle-neighborhood">
          {upperBlocks.map((block) => (
            <article className="map-block compact" key={`${block.id}-middle`}>
              <HouseRow houses={block.top} participantByHouse={participantByHouse} admin={admin} />
              <HouseRow houses={block.bottom} participantByHouse={participantByHouse} admin={admin} />
            </article>
          ))}
        </div>

        <div className="block-grid bottom-neighborhood">
          {lowerBlocks.map((block) => (
            <article className="map-block" key={block.id}>
              <HouseRow houses={block.top} participantByHouse={participantByHouse} admin={admin} />
              <div className="block-yard" aria-hidden="true" />
              <HouseRow houses={block.bottom} participantByHouse={participantByHouse} admin={admin} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HouseRow({
  houses,
  participantByHouse,
  admin
}: {
  houses: { number: number }[];
  participantByHouse: Map<number, Participant>;
  admin: boolean;
}) {
  return (
    <div className="house-row">
      {houses.map((house) => {
        const participant = participantByHouse.get(house.number);
        return (
          <div className={`house ${participant ? "participating" : ""}`} key={house.number}>
            <strong>{house.number}</strong>
            {participant ? (
              <span
                className="pumpkin"
                title={`${participant.count} participante(s) registrados`}
                aria-label={`${house.number} participa con ${participant.count} participante(s)`}
              >
                🎃
              </span>
            ) : null}
            {admin ? <small>{participant?.count || ""}</small> : null}
          </div>
        );
      })}
    </div>
  );
}
