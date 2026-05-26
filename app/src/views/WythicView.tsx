import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { MetricCard } from "../components/ui";
import { normalizeRealm } from "../domain/planning";
import type { Character, View } from "../types";

type ItemLevelInfo = {
  value: number;
  source: string;
};

function fmt(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("ko-KR") : "-";
}

function wythicCharacterUrl(character: Character) {
  const region = (character.region || "kr").toLowerCase();
  const realm = normalizeRealm(character.realmSlug || character.realm || "azshara");
  const name = encodeURIComponent(character.name || "");
  return `https://wythic.com/ko/character/${region}/${realm}/${name}`;
}

export default function WythicView({
  character,
  score,
  ilvl,
  onJump,
  readOnlyPreview,
}: {
  character: Character;
  score: number;
  ilvl: ItemLevelInfo;
  onJump: (view: View) => void;
  readOnlyPreview: boolean;
}) {
  const [frameKey, setFrameKey] = useState(0);
  const url = useMemo(() => wythicCharacterUrl(character), [character.id, character.name, character.realm, character.realmSlug, character.region]);
  if (readOnlyPreview) {
    return (
      <div className="view-stack wythic-shell">
        <section className="panel wythic-command">
          <div>
            <p className="eyebrow">Wythic Hybrid</p>
            <h1>Wythic 참고 보기</h1>
            <p>캐릭터 선택 전에는 개인 캐릭터 분석 대신 Wythic과 던전 공략으로 이어지는 읽기용 링크를 제공합니다.</p>
          </div>
          <div className="wythic-metrics">
            <MetricCard title="개인 분석" value="잠금" detail="로그인 후 캐릭터 선택" />
            <MetricCard title="던전 공략" value="열림" detail="읽기 전용 가능" />
          </div>
          <div className="command-actions">
            <a className="link-btn primary-link" href="https://wythic.com/ko/dungeon" target="_blank" rel="noreferrer">Wythic 던전 보기</a>
            <button type="button" onClick={() => onJump("dungeons")}>던전 공략</button>
            <button type="button" onClick={() => onJump("gear")}>장비 점검</button>
          </div>
        </section>
        <section className="panel wythic-fallback">
          <b>개인 Wythic 분석은 로그인 후 사용</b>
          <span>Battle.net 동기화와 캐릭터 선택이 끝나면 이 화면에서 캐릭터 전용 Wythic 분석을 바로 열 수 있습니다.</span>
          <a className="link-btn" href="https://wythic.com/ko/dungeon" target="_blank" rel="noreferrer">Wythic 원본 열기</a>
        </section>
      </div>
    );
  }
  return (
    <div className="view-stack wythic-shell">
      <section className="panel wythic-command">
        <div>
          <p className="eyebrow">Wythic Hybrid</p>
          <h1>{character.name}</h1>
          <p>{character.realm || character.realmSlug || "아즈샤라"} · {character.specName || character.spec || "전문화"} · {(character.region || "kr").toUpperCase()}</p>
        </div>
        <div className="wythic-metrics">
          <MetricCard title="RIO" value={score ? fmt(Math.round(score)) : "-"} detail="Raider.IO" />
          <MetricCard title="ILVL" value={ilvl.value ? fmt(Math.round(ilvl.value)) : "-"} detail={ilvl.source || "Battle.net"} />
        </div>
        <div className="command-actions">
          <button type="button" onClick={() => setFrameKey((value) => value + 1)}><RefreshCw size={16} /> Wythic 새로고침</button>
          <a className="link-btn primary-link" href={url} target="_blank" rel="noreferrer">원본 새 창</a>
          <button type="button" onClick={() => onJump("gear")}>장비 화면</button>
          <button type="button" onClick={() => onJump("today")}>오늘 판단</button>
        </div>
      </section>

      <section className="panel wythic-frame-panel">
        <iframe
          key={`${url}-${frameKey}`}
          title={`${character.name} Wythic 분석`}
          src={url}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <section className="panel wythic-fallback">
        <b>iframe이 비어 보이면</b>
        <span>Wythic 쪽 정책이나 브라우저 보안 설정 때문에 내장 화면이 막힌 것입니다. 이 경우 원본 새 창으로 열어 확인하면 됩니다.</span>
        <a className="link-btn" href={url} target="_blank" rel="noreferrer">Wythic 원본 열기</a>
      </section>
    </div>
  );
}
