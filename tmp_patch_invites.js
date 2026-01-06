const fs = require('fs');
const path = 'src/scenes/trombinoscope/components/admin/cr/AdminPersonInvitationsSection.tsx';
let text = fs.readFileSync(path, 'utf8');
const marker = '      {/* Liste des invitations existantes */}';
const condStart = text.indexOf(marker);
const blockStart = text.indexOf('{invLoading ? (', condStart);
const endMarker = '      ) : (\r\n        <Typography';
const blockEnd = text.indexOf(endMarker, blockStart);
if (condStart === -1 || blockStart === -1 || blockEnd === -1) {
  throw new Error('bounds not found');
}
const newBlockLines = [
  '{invLoading ? (',
  '        <CircularProgress size={18} />',
  '      ) : personInvites.length > 0 ? (',
  '        <Stack spacing={1}>',
  '          {personInvites.slice(0, INVITE_PREVIEW_LIMIT).map(renderInviteRow)}',
  '',
  '          {personInvites.length > INVITE_PREVIEW_LIMIT && (',
  '            <>',
  '              <Collapse in={showAllInvites} timeout="auto" unmountOnExit>',
  '                <Stack spacing={1} sx={{ mt: 0.5 }}>',
  '                  {personInvites',
  '                    .slice(INVITE_PREVIEW_LIMIT)',
  '                    .map(renderInviteRow)}',
  '                </Stack>',
  '              </Collapse>',
  '',
  '              <Button',
  '                size="small"',
  '                variant="text"',
  '                onClick={() => setShowAllInvites((v) => !v)}',
  '                endIcon={',
  '                  showAllInvites ? (',
  '                    <ExpandLessRoundedIcon fontSize="small" />',
  '                  ) : (',
  '                    <ExpandMoreRoundedIcon fontSize="small" />',
  '                  )',
  '                }',
  '                sx={{ alignSelf: "flex-start" }}',
  '              >',
  '                {showAllInvites',
  "                  ? \"Masquer l'historique\"",
  '                  : `Voir ${',
  '                      personInvites.length - INVITE_PREVIEW_LIMIT',
  '                    } invitation${',
  '                      personInvites.length - INVITE_PREVIEW_LIMIT > 1',
  '                        ? "s"',
  '                        : ""',
  '                    } de plus`',
  '                }',
  '              </Button>',
  '            </>',
  '          )}',
  '        </Stack>',
  '      ) : ('
];
const newBlock = newBlockLines.join('\r\n');
const newText = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);
fs.writeFileSync(path, newText);
