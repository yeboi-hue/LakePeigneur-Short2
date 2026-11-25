import React from "react";
import { Composition, staticFile } from "remotion";
import { LakePeigneurShort, DEFAULTS, Props } from "./videos/lakepeigneur/LakePeigneur";

export const Root: React.FC = () => (
  <Composition
    id="LakePeigneurShort"
    component={LakePeigneurShort}
    durationInFrames={DEFAULTS.starts[DEFAULTS.starts.length - 1]}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={DEFAULTS}
    calculateMetadata={async () => {
      try {
        const timing = await (await fetch(staticFile("timing.json"))).json();
        const props: Props = { starts: timing.starts, audio: timing.audio ?? null };
        return { durationInFrames: timing.total as number, props };
      } catch {
        return { durationInFrames: DEFAULTS.starts[DEFAULTS.starts.length - 1], props: DEFAULTS };
      }
    }}
  />
);
