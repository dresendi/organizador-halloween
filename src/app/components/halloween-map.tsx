import type { CSSProperties, ReactNode } from "react";
import { mapBlocks } from "@/lib/map-data";
import type { Participant } from "@/lib/types";

type Props = {
  participants: Participant[];
  admin?: boolean;
};

const laneGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px repeat(5, minmax(0, 1fr) 42px)",
  alignItems: "stretch"
};

export function HalloweenMap({ participants, admin = false }: Props) {
  const participantByHouse = new Map(participants.map((participant) => [participant.houseNumber, participant]));
  const upperBlocks = mapBlocks.slice(0, 5);
  const lowerBlocks = mapBlocks.slice(5);

  return (
    <section className="map-shell" aria-label="Croquis Halloween Alzare">
      <div className="croquis-board">
        <StreetRow>CALLE 57</StreetRow>
        <Lane blocks={upperBlocks} participantByHouse={participantByHouse} admin={admin} variant="open" />
        <StreetRow>CALLE 57B</StreetRow>
        <Lane blocks={upperBlocks} participantByHouse={participantByHouse} admin={admin} variant="compact" showStreets />
        <StreetRow>CALLE 59</StreetRow>
        <Lane blocks={lowerBlocks} participantByHouse={participantByHouse} admin={admin} variant="open" />
      </div>
    </section>
  );
}

function StreetRow({ children }: { children: string }) {
  return <div className="map-street-row">{children}</div>;
}

function Lane({
  blocks,
  participantByHouse,
  admin,
  variant,
  showStreets = false
}: {
  blocks: typeof mapBlocks;
  participantByHouse: Map<number, Participant>;
  admin: boolean;
  variant: "open" | "compact";
  showStreets?: boolean;
}) {
  const streets = ["CALLE 82", "CALLE 80A", "CALLE 80", "CALLE 78A", "CALLE 78", "CALLE 76A"];

  return (
    <div className={`map-lane ${variant === "compact" ? "compact-lane" : ""}`} style={laneGrid}>
      {blocks.map((block, index) => (
        <FragmentBlock key={block.id}>
          <VerticalStreet visible={showStreets}>{streets[index]}</VerticalStreet>
          <article className={`map-block ${variant === "compact" ? "compact" : ""}`}>
            <HouseRow houses={block.top} participantByHouse={participantByHouse} admin={admin} />
            {variant === "open" ? <div className="block-yard" aria-hidden="true" /> : null}
            <HouseRow houses={block.bottom} participantByHouse={participantByHouse} admin={admin} />
          </article>
          {index === blocks.length - 1 ? <VerticalStreet visible={showStreets}>{streets[index + 1]}</VerticalStreet> : null}
        </FragmentBlock>
      ))}
    </div>
  );
}

function FragmentBlock({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function VerticalStreet({ visible, children }: { visible: boolean; children: string }) {
  return (
    <div className="map-vertical-street" aria-hidden={!visible}>
      {visible ? children : null}
    </div>
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
                {"\u{1F383}"}
              </span>
            ) : null}
            {admin ? <small>{participant?.count || ""}</small> : null}
          </div>
        );
      })}
    </div>
  );
}
