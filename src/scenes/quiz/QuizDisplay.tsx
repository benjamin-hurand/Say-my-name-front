// src/components/QuizDisplay.tsx
import './QuizDisplay.css'
import BlockIcon from '@mui/icons-material/Block'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import NoteIcon from '@mui/icons-material/Note'
import ReportIcon from '@mui/icons-material/Report'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import {
  Box,
  Button,
  Chip,
  Fade,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PersonAttributeLite, ResultAttr } from '../../models/commons/PersonAttribute'
import { DifficultyLevel, PoolType } from '../../services/dto/courses/CourseQuestionDto'
import { isReadable } from 'stream'

export interface QuizDisplayProps {
  // 0. Theme
  color: string

  // 1. Progress
  elapsed?: number
  progress?: number

  // 2. Photo
  photoUrl: string | null
  hasFetched: boolean
  isLoading: boolean

  // 3. Badges
  poolBadge?: PoolType
  difficultyBadge?: DifficultyLevel

  // 4. Help
  useHelp?: () => Promise<PersonAttributeLite[]>

  // 5. Initials
  initials: string | null
  showInitials: boolean

  // 6. User Answer
  answer: string
  handleAnswerChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  validateAnswer: () => void

  // 7. Results
  isResultMode?: boolean
  resultMessage?: string
  resultAttributes?: ResultAttr[];
  onNext?: () => void

  // 8. Navigation: Options
  openQuizOptions?: () => void

  // 9a. End Of Quiz: Course
  onReloadBatch?: () => void
  onFreeTraining?: () => void

  // 9b. End Of Quiz: Quiz
  onRetry?: () => void
  onCreateChallenge?: () => void
  hasHistory?: boolean
  fromChallenge?: boolean
  goBackToChallenge?: () => void
}

const poolColors: Record<PoolType, string> = {
  NEW: '#FFB300',
  NOT_SO_NEW: '#FFB300',
  ERROR_RECENT: '#D32F2F',
  SRS_DUE: '#1976D2',
  LONG_TERM: '#388E3C',
  RAPID_CHECK: '#7B1FA2',
  RANDOM: '#F57C00',
  DIFFICULT: '#0288D1',
}

const difficultyColors: Record<DifficultyLevel, string> = {
  EASY: '#AED581',
  MEDIUM: '#FFF176',
  HARD: '#EF5350',
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  // 0. Theme
  color,

  // 1. Progress
  elapsed,
  progress,

  // 2. Photo
  photoUrl,
  hasFetched,
  isLoading,

  // 3. Badges
  poolBadge,
  difficultyBadge,

  // 4. Help
  useHelp,

  // 5. Initials
  initials,
  showInitials,

  // 6. User Answer
  answer,
  handleAnswerChange,
  validateAnswer,

  // 7. Results
  isResultMode = false,
  resultMessage,
  resultAttributes,
  onNext,

  // 8. Navigation: Options
  openQuizOptions,

  // 9a. End Of Quiz: Course
  onReloadBatch,
  onFreeTraining,

  // 9b. End Of Quiz: Quiz
  onRetry,
  onCreateChallenge,
  hasHistory = false,
  fromChallenge,
  goBackToChallenge

}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [helpAttributes, setHelpAttributes] = useState<PersonAttributeLite[] | null>(null)
  const [attributesLoading, setAttributesLoading] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isImportant, setIsImportant] = useState<boolean>(false)
  const [nextRequested, setNextRequested] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState(false)
  const [shake, setShake] = useState<boolean>(false);
  const holdStart = useRef<number| null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [willActivate, setWillActivate] = useState(false)
  const [willCancel, setWillCancel]   = useState(false)
  const [showResultLabel, setShowResultLabel] = useState(false)



  const triggerShake = () => {
    setShake(true)
    // on retire la classe après la durée de l’anim
    setTimeout(() => setShake(false), 400)
  }

  useEffect(() => {
    setNextRequested(false)
    setHelpAttributes(null)
    setHoldProgress(0)
    setWillActivate(false)
    setWillCancel(false)
  }, [photoUrl])

  useEffect(() => {
      const fetchHelpAttributes = async () => {
        if (!helpAttributes && isFlipped && !isResultMode && useHelp) {
          setAttributesLoading(true)
          try {
            console.log('recup help BIS');
            const attrs = await useHelp()
            setHelpAttributes(attrs)
          } catch {
            console.error('Erreur chargement des attributs')
          } finally {
            setAttributesLoading(false)
          }
        }
      }
      fetchHelpAttributes()
    }, [helpAttributes, isFlipped])

  useEffect(() => {
    if (!isResultMode && photoUrl && inputRef.current) {
      // On met un petit délai pour laisser React appliquer le DOM
      setTimeout(() => inputRef.current!.focus(), 0)
    }
  }, [isResultMode, photoUrl])

  useEffect(() => {
    if (isResultMode) {
      setIsFlipped(true)
    } else {
      setShowResultLabel(false)
    }
  }, [isResultMode])


  const handleSubmitClick = () => {
    if (answer.trim() === "") {
      triggerShake()
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      validateAnswer()
    }
  }

  const handleFlip = async () => {
    if (isAnimating) return
    setIsAnimating(true)
 
    // On inverse toujours le flip
    setIsFlipped(f => !f)
  }
  
  const handleNext = useCallback(() => {
    if (isAnimating) return       // ignore si en cours
    setIsAnimating(true)
    setIsFlipped(false)
    setNextRequested(true)
  }, [])

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // si on est en résultat, on ne fait rien
      if (isResultMode) return;
      const input = inputRef.current;
      if (!input) return;

      // si ce n'est pas déjà focus et si c'est un caractère imprimable
      if (document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        input.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => {
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, [isResultMode]);


  useEffect(() => {
    let rafId: number;
    const activatedRef = { current: false };
    const MIN_HOLD = 300;  // seuil du « court appui »
    const FULL_HOLD = 600; // seuil du « flip »
    const MAX_SUPER_HOLD = 2000; // seuil du « super-hold »

    const step = () => {
      if (holdStart.current === null) return;
      const elapsed = Date.now() - holdStart.current;

      // si on dépasse MAX_SUPER_HOLD, on annule tout
      if (elapsed > MAX_SUPER_HOLD) {
        setWillCancel(true);
        setHoldProgress(0);
        holdStart.current = null;
        return;
      }

      let prog = 0;
      if (elapsed >= MIN_HOLD) {
        // entre 300 ms et 600 ms, prog from 0→1
        prog = Math.min((elapsed - MIN_HOLD) / (FULL_HOLD - MIN_HOLD), 1);
      }
      setHoldProgress(prog);

      // si on n’est pas encore arrivé à FULL_HOLD, on continue l’animation
      if (elapsed < FULL_HOLD) {
        rafId = requestAnimationFrame(step);
      } else {
        // à FULL_HOLD atteint, on marque qu’on doit flip à la release
        activatedRef.current = true;
      }
    };


    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || isAnimating) return;

      // ===> Réinit des animations et du progress
      setWillCancel(false);
      setWillActivate(false);
      setHoldProgress(0);

      if (holdStart.current === null) {
        holdStart.current = Date.now();
        activatedRef.current = false;
        rafId = requestAnimationFrame(step);
      }
    };


    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const elapsed = Date.now() - (holdStart.current || 0);
      cancelAnimationFrame(rafId);

      // **1) super-hold (> 4 s) : on ne fait rien, on sort**
      if (elapsed > MAX_SUPER_HOLD) {
        holdStart.current = null;
        return;
      }

      // 2) court
      if (elapsed < 300) {
        isResultMode ? handleNext() : handleSubmitClick();
      }
      // 3) moyen (>= 600 ms)  
      else if (activatedRef.current) {
        handleFlip();
        setTimeout(() => setWillActivate(false), 300);
      }
      // 4) entre 300 et 600 ms (jamais arrivé ici car >= 600 fait flip)  
      //    ou entre 600 et 4 s si on n’a pas atteint 600 ms exact  
      else {
        setHoldProgress(0);
      }

      holdStart.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      cancelAnimationFrame(rafId);
    };
  }, [isAnimating, isResultMode, validateAnswer, handleNext]);




  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }
  const closeMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(null)
  }
  const toggleImportant = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setIsImportant(i => !i)
  }

  // helper pour le style partagé
  const iconBtnSx = {
    backgroundColor: `${color}CC`,    // ton fond semi-transparent
    color: '#242424',                    // la couleur "courante" des icônes
    boxShadow: 1,
    '&:hover': {
      backgroundColor: `${color}FF`,  // fond à 100% opacity au hover
    },
    // <-- ajoute cette ligne pour forcer le fill des <SvgIcon> à noir
    '& .MuiSvgIcon-root': {
      fill: '#242424',
    }
  }

  return (
    <Box sx={{ position: 'relative', p: 2, width: '100%', height: '100%' }}>
      {/* Progress bar */}
      {typeof progress === 'number' && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: 4,
            zIndex: 10,
            '& .MuiLinearProgress-bar': { backgroundColor: color },
          }}
        />
      )}

      {/* Elapsed timer */}
      {typeof elapsed === 'number' && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8, right: 16,
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.4)',
            px: 1, borderRadius: 1,
            zIndex: 10,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {`${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`}
        </Typography>
      )}

      <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>
        {/* Image / Flash-card */}
        {(isLoading || !hasFetched) ? (
          <Skeleton
            variant="rectangular" width="100%" height={300} animation="wave"
            sx={{ backdropFilter:'blur(3px)', backgroundColor: color + '10' }}
          />
        ) : photoUrl ? (
          <Tooltip
            title={useHelp?'Cliquez pour voir la fiche':''}
            placement="top" disableHoverListener={!useHelp}
          >
            <Box
              onClick={(useHelp || isResultMode)?handleFlip:undefined}
              role={useHelp?'button':undefined}
              aria-label={useHelp?'Afficher la fiche d’aide':undefined}
              sx={{
                perspective:'1000px',
                width:'100%', height:'56vh',
                cursor:useHelp?'pointer':'default',
                mb:2, position:'relative'
              }}
            >
              <Box
                sx={{
                  width:'100%', height:'100%',
                  position:'relative',
                  transformStyle:'preserve-3d',
                  transition:'transform 0.6s ease-in-out',
                  transform:isFlipped?'rotateY(180deg)':'none'
                }}
                onTransitionEnd={e => {
                  if (e.propertyName !== 'transform') return;
                  setIsAnimating(false)
                  if (isResultMode && isFlipped) {
                    setShowResultLabel(true)
                  }
                  if (nextRequested && !isFlipped) {
                    setNextRequested(false)
                    onNext?.()
                  }
                }}
              >
                {/* Face avant */}
                <Box sx={{ backfaceVisibility:'hidden', position:'absolute', inset:0 }}>
                  <TransitionGroup component="div">
                    <CSSTransition
                      key={photoUrl}
                      timeout={500}
                      classNames="fade"
                      unmountOnExit
                      mountOnEnter
                      onExited={() => setIsAnimating(false)}  // fin du fade-out
                      onEntered={() => setIsAnimating(false)} // fin du fade-in
                    >
                      <Box
                        component="img"
                        src={photoUrl}
                        alt="Personne à identifier"
                        sx={{
                          width:'100%', height:'100%',
                          objectFit:'cover',
                          boxShadow:`0 0 20px ${color}`,
                          position:'absolute', inset:0
                        }}
                      />
                    </CSSTransition>
                  </TransitionGroup>

                  {/* Favoris */}
                  <IconButton
                    onClick={toggleImportant}
                    sx={{
                      position:'absolute', top:8, left:8, zIndex:3,
                      ...iconBtnSx
                    }}
                  >
                    {isImportant ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>

                  {/* Badges */}
                  <Box sx={{
                    position:'absolute', top:8, left:'50%',
                    transform:'translateX(-50%)',
                    display:'flex', gap:1, zIndex:3
                  }}>
                    {poolBadge && (
                      <Chip
                        label={poolBadge.replace('_',' ')}
                        size="small"
                        sx={{ backgroundColor:poolColors[poolBadge], color:'#fff' }}
                      />
                    )}
                    {difficultyBadge && (
                      <Chip
                        label={difficultyBadge}
                        size="small"
                        sx={{ backgroundColor:difficultyColors[difficultyBadge], color:'#000' }}
                      />
                    )}
                  </Box>

                  {/* Menu */}
                  {!isFlipped && useHelp && (
                    <>
                      <IconButton
                        onClick={openMenu}
                        sx={{
                          position:'absolute', top:8, right:8, zIndex:3,
                          ...iconBtnSx
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                        anchorOrigin={{ vertical:'top', horizontal:'right' }}
                        transformOrigin={{ vertical:'top', horizontal:'right' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);/*report*/}}>
                          <ReportIcon fontSize="small" sx={{mr:1}}/>Signaler un problème
                        </MenuItem>
                        <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);setIsImportant(i=>!i)}}>
                          <StarIcon fontSize="small" sx={{mr:1}}/>Important
                        </MenuItem>
                        <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);/*indésirable*/}}>
                          <BlockIcon fontSize="small" sx={{mr:1}}/>Indésirable
                        </MenuItem>
                        <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);/*note*/}}>
                          <NoteIcon fontSize="small" sx={{mr:1}}/>Note
                        </MenuItem>
                        <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);/*prononciation*/}}>
                          <VolumeUpIcon fontSize="small" sx={{mr:1}}/>Prononciation
                        </MenuItem>
                      </Menu>
                    </>
                  )}

                  {/* Aide */}
                  {(useHelp || isResultMode) && !isFlipped && (
                    <Chip
                      label={showResultLabel ? "Résultats" : "Aide"}
                      size="small"
                      variant="outlined"
                      className={willActivate || willCancel ? 'chip-shake' : undefined}
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderColor: '#fff',
                        color: '#fff',
                        zIndex: 2,
                        /* conic-gradient pour l’anneau de progression */
                        background: `conic-gradient(
                          ${color} ${holdProgress * 360}deg,
                          rgba(255,255,255,0) 0deg
                        )`,
                      }}
                    />


                  )}
                </Box>

                {/* Face arrière */}
                <Box
                  sx={{
                    backfaceVisibility:'hidden',
                    transform:'rotateY(180deg)',
                    position:'absolute',
                    inset:0
                  }}
                >
                  {/* Wrapper miroir */}
                  <Box sx={{ width:'100%', height:'100%', transform:'scaleX(-1)', position:'relative' }}>
                    <Box
                      sx={{
                        position:'absolute', inset:0,
                        backgroundImage:`url(${photoUrl})`,
                        backgroundSize:'cover',
                        backgroundPosition:'center',
                        filter:'brightness(20%)'
                      }}
                    />

                    {/* Favoris */}
                    <IconButton
                      onClick={toggleImportant}
                      sx={{
                        position:'absolute', top:8, left:8, zIndex:3,
                        ...iconBtnSx
                      }}
                    >
                      {isImportant ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>

                    {/* Badges */}
                    <Box sx={{
                      position:'absolute', top:8, left:'50%',
                      transform:'translateX(-50%)',
                      display:'flex', gap:1, zIndex:3
                    }}>
                      {poolBadge && (
                        <Chip
                          label={poolBadge.replace('_',' ')}
                          size="small"
                          sx={{ backgroundColor:poolColors[poolBadge], color:'#fff' }}
                        />
                      )}
                      {difficultyBadge && (
                        <Chip
                          label={difficultyBadge}
                          size="small"
                          sx={{ backgroundColor:difficultyColors[difficultyBadge], color:'#000' }}
                        />
                      )}
                    </Box>

                    {/* Menu */}
                    <IconButton
                      onClick={openMenu}
                      sx={{
                        position:'absolute', top:8, right:8, zIndex:3,
                        ...iconBtnSx
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={closeMenu}
                      anchorOrigin={{ vertical:'top', horizontal:'right' }}
                      transformOrigin={{ vertical:'top', horizontal:'right' }}
                      onClick={e=>e.stopPropagation()}
                    >
                      <MenuItem onClick={e=>{e.stopPropagation();closeMenu(e);/*…*/}}>
                        <ReportIcon fontSize="small" sx={{mr:1}}/>Signaler un problème
                      </MenuItem>
                      {/* … */}
                    </Menu>

                    {/* Infos centrées */}
                    <Box
                      sx={{
                        position:'absolute', inset:0,
                        display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center',
                        p:3, textAlign:'center', userSelect:'none'
                      }}
                    >
                      <Box sx={{ transform:'scaleX(-1)' }}>
                        {/* Message résultat */}
                        {attributesLoading ? (
                          <Skeleton width="60%" height={40}/>
                        ) : isResultMode ? (
                            <>
                              <Typography variant="h4">{resultMessage}</Typography>
                              <br/>
                              {(resultAttributes ?? []).map(attr => (
                                <Typography
                                  key={attr.attribute.id}
                                  sx={{
                                    color: attr.isTarget
                                      ? (attr.isCorrect ? 'success.main' : 'error.main')
                                      : 'common.white',
                                    fontWeight: attr.isTarget ? 'bold' : 500
                                  }}
                                >
                                  {attr.attribute.name}: {attr.value}
                                  {attr.isTarget && (attr.isCorrect ? ' ✓' : ' ✕')}
                                </Typography>
                              ))}
                            </>
                          ) : (
                            <>
                              {(helpAttributes ?? []).map(attr => (
                                <Typography key={attr.attribute.id} color="common.white">
                                  {attr.attribute.name}: {attr.value}
                                </Typography>
                              ))}
                            </>
                          )}

                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              height: '56vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            {/* Message principal */}
            {!onReloadBatch ? (
              hasHistory ? (
                fromChallenge ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Bravo, vous êtes prêt pour retourner au challenge.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={goBackToChallenge}
                      sx={{ mb: 2 }}
                    >
                      Retourner au challenge
                    </Button>
                    <br/>
                    <Typography variant="subtitle1" gutterBottom>
                      Rester sur le quiz ?
                    </Typography>
                  </>
                ) : (
                  <Typography variant="h6" gutterBottom>
                    Bravo, vous avez fini le quiz.
                  </Typography>
                )
              ) : (
                <Typography variant="h6" color="error" gutterBottom>
                  Aucun résultat trouvé.
                </Typography>
              )
            ) : (
              <Typography variant="h6" gutterBottom>
                Vous avez appris de nombreux mots, voulez‐vous aller vous entraîner ou continuer le quiz ?
              </Typography>
            )}

            {/* Boutons d’action */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Toujours proposer de recommencer si un historique existe */}
              {hasHistory && onRetry && (
                <Button onClick={onRetry}>Recommencer le quiz</Button>
              )}

              {/* Modifier les options */}
              {openQuizOptions && (
                <Button onClick={openQuizOptions}>Modifier les options</Button>
              )}

              {/* Créer un challenge seulement si on n’est pas déjà dans un challenge */}
              {!fromChallenge && onCreateChallenge && (
                <Button onClick={onCreateChallenge}>Créer un challenge</Button>
              )}

              {/* Continuer le cours */}
              {onReloadBatch && (
                <Button onClick={onReloadBatch}>Continuer le cours</Button>
              )}

              {/* Basculer en free training */}
              {onFreeTraining && (
                <Button onClick={onFreeTraining}>Réviser ces mots en free training</Button>
              )}
            </Box>
          </Box>
        )}

        

        {/* Réponse */}
        <TextField
          inputRef={inputRef}
          variant="outlined"
          placeholder="Tapez votre réponse ici…"
          className={shake ? 'textField-shake' : undefined}
          label={showInitials&&initials?`Initiales : ${initials}`:''}
          value={answer}
          onChange={handleAnswerChange}
          onFocus={() => isFlipped && handleFlip()}
          onKeyDown={(e) => isFlipped && e.key !== "Enter" && handleFlip()}
          InputLabelProps={{ shrink: true }}
          sx={{ my:2, width:'100%' }}
          disabled={isResultMode}
        />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 1 }}>
          {!isResultMode && openQuizOptions && (
            <Button variant="outlined" className="menu" onClick={openQuizOptions}>
              Options
            </Button>
          )}

          {!isResultMode && (
          <Button
            variant="contained"
            className="menu"
            onClick={handleSubmitClick}
            disabled={isAnimating}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,          // garde l’aspect rectangulaire légèrement arrondi
              px: 3, py: 1.5            // ajustements de padding si besoin
            }}
          >
            Submit Answer

            {/* Anneau progressif */}
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 1,
                boxSizing: 'border-box',
                border: '2px solid rgba(255,255,255,0.5)',
                transform: `scale(${1 + holdProgress * 0.2})`, // s’agrandit jusqu’à +20%
                opacity: holdProgress,                         // devient plus opaque
                transition: 'transform 0.1s linear, opacity 0.1s linear',
                pointerEvents: 'none'                          // n’intercepte pas les clics
              }}
            />
          </Button>
        )}

          {isResultMode && onNext && (
            <Button variant="contained" className="menu" disabled={isAnimating} onClick={handleNext}>
              Suivant
            </Button>
          )}
        </Box>
    </Box>
    </Box>
  )
}

export default QuizDisplay
