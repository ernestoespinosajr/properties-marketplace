import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Módulo cargado solo en el navegador. Leaflet toca `window` al importarse, así
 * que Mapa.tsx lo trae con React.lazy y aquí ya se puede importar de forma
 * estática y normal.
 *
 * El marcador es un divIcon (puro CSS) en lugar del icono por defecto: el de
 * Leaflet referencia PNG por ruta relativa y se rompe al empaquetar.
 */
const ICONO = divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#1b4332;box-shadow:0 0 0 4px rgba(27,67,50,.25),0 1px 4px rgba(0,0,0,.4)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const TILES = (
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
);

export function VistaInterna({
  lat,
  lng,
  etiqueta,
}: {
  lat: number;
  lng: number;
  etiqueta?: string;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      {TILES}
      <Marker position={[lat, lng]} icon={ICONO}>
        {etiqueta && <Popup>{etiqueta}</Popup>}
      </Marker>
    </MapContainer>
  );
}

/**
 * Componente de nivel superior a propósito. Declararlo dentro del render del
 * mapa le daría una identidad nueva en cada pasada, React lo desmontaría y
 * volvería a montar, y el handler de clic no llegaría a registrarse nunca.
 */
function Capturador({ onCambio }: { onCambio: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onCambio(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export function SelectorInterno({
  lat,
  lng,
  onCambio,
}: {
  lat: number | null;
  lng: number | null;
  onCambio: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[lat ?? 18.4861, lng ?? -69.9312]}
      zoom={lat != null ? 14 : 10}
      className="h-full w-full"
    >
      {TILES}
      <Capturador onCambio={onCambio} />
      {lat != null && lng != null && <Marker position={[lat, lng]} icon={ICONO} />}
    </MapContainer>
  );
}
