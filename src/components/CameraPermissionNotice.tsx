interface CameraPermissionNoticeProps {
  reason: 'no-camera' | 'denied' | 'error';
}

const COPY: Record<CameraPermissionNoticeProps['reason'], string> = {
  'no-camera': "This device doesn't have a camera Scanbite can use.",
  denied: "Camera access was denied - you can still look up a product below.",
  error: "Couldn't start the camera - you can still look up a product below.",
};

/** Rendered in place of the video element whenever the camera path isn't usable - never a dead end, manual entry is always right below it. */
export function CameraPermissionNotice({ reason }: CameraPermissionNoticeProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-sunken p-4 text-center text-sm text-ink-muted">
      {COPY[reason]}
    </div>
  );
}
