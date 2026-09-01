import re

with open('src/components/ClientBuilder.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace state declaration
content = content.replace(
    """  const [syncLaptopSurfaces, setSyncLaptopSurfaces] = useState(false);""",
    """  const [surfaceSyncEnabled, setSurfaceSyncEnabled] = useState<Record<LaptopSurface, boolean>>({
    'top-lid': false,
    'keyboard-deck': false,
    'bottom-base': false,
  });"""
)

# Remove laptopSyncSourceSurface and laptopSyncSourceLabel definitions and handleBreakSync
pattern1 = r'\n  const laptopSyncSourceSurface = laptopSelectedSurfaces\[0\] \?\? null;.*?const handleBreakSync = \(surface: LaptopSurface\) => \{[^}]*\n  \};\n'
content = re.sub(pattern1, '\n', content, flags=re.DOTALL)

# Remove handleBreakSync call from handleToggleLaptopSurface
content = content.replace(
    """  const handleToggleLaptopSurface = (surface: LaptopSurface) => {
    handleBreakSync(surface);
    markSelectionStarted();""",
    """  const handleToggleLaptopSurface = (surface: LaptopSurface) => {
    markSelectionStarted();"""
)

# Replace old sync UI block with new checkbox UI
old_ui = r'{laptopSelectedSurfaces\.length > 1 && \(\s*<div className="rounded-2xl border border-black/10 bg-\[#f7f7f5\] p-4">\s*<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">.*?</div>\s*\)}'
new_ui = '''{laptopSelectedSurfaces.length > 1 && (
        <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60 mb-3">Sync surfaces</p>
          <div className="flex flex-wrap gap-2">
            {laptopSelectedSurfaces.map((surface) => {
              const label = LAPTOP_SURFACES.find((item) => item.value === surface)?.label ?? 'Surface';
              const isEnabled = surfaceSyncEnabled[surface];
              return (
                <button
                  key={surface}
                  type="button"
                  onClick={() => {
                    setSurfaceSyncEnabled((current) => ({
                      ...current,
                      [surface]: !current[surface],
                    }));
                    if (!isEnabled) {
                      applySurfaceToSyncedSurfaces(surface);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                    isEnabled
                      ? 'border-[#2f7777] bg-[#edf5f5] text-[#2f7777]'
                      : 'border-black/10 bg-white text-black/70 hover:border-black/30'
                  }`}
                >
                  {isEnabled && <i className="bx bx-check text-sm" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}'''

#content = re.sub(old_ui, new_ui, content, flags=re.DOTALL)

# Rename and update function (if it still exists)
pattern_old_func = r'const syncSelectedSurfaceToOtherSurfaces = \(sourceSurface: LaptopSurface\) => \{.*?setLaptopCopiedSettings\(true\);.*?\};'
if re.search(pattern_old_func, content, flags=re.DOTALL):
    print("Found old sync function, replacing...")

with open('src/components/ClientBuilder.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated ClientBuilder.tsx - removed old sync state and helper functions')
