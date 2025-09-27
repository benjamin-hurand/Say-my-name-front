import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardHeader,
  CardProps,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type Props = CardProps & {
  headerTitle: React.ReactNode;
  subtitle?: React.ReactNode;
  defaultExpanded?: boolean;
  headerSx?: CardProps["sx"];
};

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (["button", "input", "select", "textarea", "label", "a", "option"].includes(tag)) return true;
  // MUI interactive roots
  if (
    target.closest(".MuiButton-root") ||
    target.closest(".MuiSwitch-root") ||
    target.closest(".MuiSelect-root") ||
    target.closest(".MuiSlider-root") ||
    target.closest("[role='button']") ||
    target.closest("[contenteditable='true']")
  ) {
    return true;
  }
  return false;
}

const SectionCard: React.FC<React.PropsWithChildren<Props>> = ({
  headerTitle: title,
  subtitle,
  defaultExpanded = false,
  children,
  sx,
  headerSx,
  ...rest
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggle = React.useCallback(() => setExpanded(v => !v), []);

  // Rendre toute la carte cliquable pour ouvrir si elle est repliée
  const onCardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (expanded) return; // déjà ouvert → ne pas toggle sur clic dans le corps
    if (isInteractive(e.target)) return;
    setExpanded(true);
  };

  return (
    <Card
      variant="outlined"
      sx={{ overflow: "hidden", ...sx }}
      onClick={onCardClick}
      {...rest}
    >
      <Accordion
        elevation={0}
        square
        disableGutters
        expanded={expanded}
        onChange={(_, v) => setExpanded(v)}
        sx={{
          "&:before": { display: "none" },
          boxShadow: "none",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            "& .MuiAccordionSummary-content": { m: 0 },
            cursor: "pointer",
            px: 2,
            py: 1.5,
          }}
          // Rendre la bannière entièrement cliquable
          onClick={(e) => {
            if (isInteractive(e.target)) return;
            handleToggle();
          }}
        >
          <CardHeader
            title={title}
            subheader={subtitle}
            sx={{
              px: 0,
              py: 0,
              "& .MuiCardHeader-title": { fontSize: 16, fontWeight: 600 },
              "& .MuiCardHeader-subheader": { fontSize: 13, opacity: 0.8 },
              ...headerSx,
            }}
          />
        </AccordionSummary>

        <AccordionDetails sx={{ px: 2, pb: 2 }}>
          {children}
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default SectionCard;
