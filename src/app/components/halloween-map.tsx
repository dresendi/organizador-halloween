import type { CSSProperties, ReactNode } from "react";
import { createLocationId, mapBlocks } from "@/lib/map-data";
import type { Participant } from "@/lib/types";

type Props = {
  participants: Participant[];
  admin?: boolean;
};

const blockWidth = 256;
const streetGap = 48;
const sideStreet = 44;
const boardWidth = blockWidth * 5 + streetGap * 4 + sideStreet * 2;

const boardStyle: CSSProperties = {
  position: "relative",
  width: boardWidth,
  maxWidth: "none",
  padding: `4px ${sideStreet}px 0`
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(5, ${blockWidth}px)`,
  columnGap: streetGap,
  position: "relative",
  zIndex: 1
};

export function HalloweenMap({ participants, admin = false }: Props) {
  const participantByLocation = new Map(participants.map((participant) => [participant.locationId, participant]));
  const upperBlocks = mapBlocks.slice(0, 5);
  const lowerBlocks = mapBlocks.slice(5);

  return (
    <section className="map-shell" aria-label="Croquis Halloween Alzare">
      <div className="croquis-board" style={boardStyle}>
        <StreetLabel variant="horizontal" top={86}>
          CALLE 57
        </StreetLabel>
        <StreetLabel variant="horizontal" top={330}>
          CALLE 57B
        </StreetLabel>
        <StreetLabel variant="horizontal" top={568}>
          CALLE 59
        </StreetLabel>
        <StreetLabel variant="vertical" left={0}>
          CALLE 82
        </StreetLabel>
        <StreetLabel variant="vertical" left={302}>
          CALLE 80A
        </StreetLabel>
        <StreetLabel variant="vertical" left={606}>
          CALLE 80
        </StreetLabel>
        <StreetLabel variant="vertical" left={910}>
          CALLE 78A
        </StreetLabel>
        <StreetLabel variant="vertical" left={1214}>
          CALLE 78
        </StreetLabel>
        <StreetLabel variant="vertical" right={0}>
          CALLE 76A
        </StreetLabel>

        <div className="block-grid top-neighborhood" style={gridStyle}>
          {upperBlocks.map((block) => (
            <article className="map-block" key={block.id}>
              <HouseRow houses={block.top} street="Calle 57" participantByLocation={participantByLocation} admin={admin} />
              <div className="block-yard" aria-hidden="true" />
              <HouseRow houses={block.bottom} street="Calle 57" participantByLocation={participantByLocation} admin={admin} />
            </article>
          ))}
        </div>

        <div className="block-grid middle-neighborhood" style={{ ...gridStyle, marginTop: 46 }}>
          {upperBlocks.map((block) => (
            <article className="map-block compact" key={`${block.id}-middle`} style={{ display: "grid", gap: 24 }}>
              <HouseRow houses={block.top} street="Calle 57B" participantByLocation={participantByLocation} admin={admin} />
              <HouseRow houses={block.bottom} street="Calle 57B" participantByLocation={participantByLocation} admin={admin} />
            </article>
          ))}
        </div>

        <div className="block-grid bottom-neighborhood" style={{ ...gridStyle, marginTop: 46 }}>
          {lowerBlocks.map((block) => (
            <article className="map-block" key={block.id}>
              <HouseRow houses={block.top} street="Calle 59" participantByLocation={participantByLocation} admin={admin} />
              <div className="block-yard" aria-hidden="true" />
              <HouseRow houses={block.bottom} street="Calle 59" participantByLocation={participantByLocation} admin={admin} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StreetLabel({
  variant,
  top,
  left,
  right,
  children
}: {
  variant: "horizontal" | "vertical";
  top?: number;
  left?: number;
  right?: number;
  children: ReactNode;
}) {
  const style: CSSProperties =
    variant === "horizontal"
      ? {
          position: "absolute",
          left: sideStreet,
          right: sideStreet,
          top,
          color: "#111",
          fontSize: "2.25rem",
          fontWeight: 900,
          lineHeight: 1,
          textAlign: "center",
          zIndex: 2,
          pointerEvents: "none"
        }
      : {
          position: "absolute",
          top: 232,
          left,
          right,
          width: 44,
          height: 238,
          display: "grid",
          placeItems: "center",
          color: "#111",
          fontSize: "2rem",
          fontWeight: 900,
          lineHeight: 1,
          textAlign: "center",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          zIndex: 2,
          pointerEvents: "none"
        };

  return <div style={style}>{children}</div>;
}

function HouseRow({
  houses,
  street,
  participantByLocation,
  admin
}: {
  houses: { number: number }[];
  street: string;
  participantByLocation: Map<string, Participant>;
  admin: boolean;
}) {
  return (
    <div className="house-row">
      {houses.map((house) => {
        const participant = participantByLocation.get(createLocationId(street, house.number));
        return (
          <div className={`house ${participant ? "participating" : ""}`} key={house.number}>
            <strong>{house.number}</strong>
            {participant ? (
              <span
                className="pumpkin"
                title={`${participant.count} participante(s) registrados`}
                aria-label={`${street} ${house.number} participa con ${participant.count} participante(s)`}
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
