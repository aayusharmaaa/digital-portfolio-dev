import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#e8e8e8',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: '50%',
            border: '28px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-0.06em',
            fontSize: 190,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          AS
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

