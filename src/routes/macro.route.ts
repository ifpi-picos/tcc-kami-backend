import { Router, Request, Response } from 'express'
import db from '../config/database'
import MacroController from '../controllers/macro.controller'
import logger from '../config/logger'
import MacroServices from '../services/macro.services'
import { Discord_Id } from '../types/validations'
import { default as Events } from '../websocket/events'

const router = Router()
const macroController = new MacroController(db)
const macroServices = new MacroServices()

router.get('/one', async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            req.user = { id: 0, discord_id: new Discord_Id('000000000000000000'), username: '', avatar_url: '', is_beta: false, is_premium: false }
        }

        if (req.query.id) {
            const macro = await macroController.getById(Number(req.query.id))

            if (macro) {
                if (macro.user_id === req.user.id || macro.is_public === true) {
                    macro.user = req.user

                    res.status(200).json({ macro: macro })
                } else {
                    res.status(403).json({ error: 'Forbidden' })
                }
            } else {
                res.status(404).json({ error: 'Macro not found' })
            }
        } else if (req.query.userId && req.query.macroName) {
            const macro = await macroController.getByUserIdAndMacroName(Number(req.query.userId), req.query.macroName.toString())

            if (macro) {
                if (macro.user_id === req.user.id || macro.is_public === true) {
                    macro.user = req.user

                    res.status(200).json({ macro: macro })
                } else {
                    res.status(403).json({ error: 'Forbidden' })
                }
            } else {
                res.status(404).json({ error: 'Macro not found' })
            }
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.get('/all', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            const macros = await macroController.getAllByUserId(Number(req.user.id))

            if (macros && macros.length > 0) {
                res.status(200).json({ macros: macros })
            } else {
                res.status(404).json({ error: 'Macros not found' })
            }
        } else {
            res.status(401).json({ error: 'Unauthorized' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.post('/create', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            req.body.user_id = req.user.id

            const validationErrors = await macroServices.validate(req.body)

            if (validationErrors.length > 0) {
                res.status(400).json({ errors: validationErrors })
            } else {
                const preparedMacro = await macroServices.prepareMacro(req.body, req.user.id)

                const macro = await macroController.create(preparedMacro)

                if (macro) {
                    res.status(201).json({ macro: macro })
                } else {
                    res.status(500).json({ error: 'Internal Server Error' })
                }
            }
        } else {
            res.status(401).json({ error: 'Unauthorized' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.put('/update', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            const validationErrors = await macroServices.validateUpdate(req.body)

            if (validationErrors.length > 0) {
                res.status(400).json({ errors: validationErrors })
            } else {
                const preparedMacro = await macroServices.prepareMacroUpdate(req.body)

                const macro = await macroController.updateById(Number(req.body.id), preparedMacro)

                if (macro) {
                    Events.emit('macro-updated', req.body.socketIdentifier, macro)
                    res.status(200).json({ macro: macro })
                } else {
                    res.status(500).json({ error: 'Internal Server Error' })
                }
            }
        } else {
            res.status(401).json({ error: 'Unauthorized' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.delete('/delete', async (req: Request, res: Response) => {
    try {
        if (req.user) {
            if (req.query.id) {
                const macro = await macroController.getById(Number(req.query.id))

                if (macro) {
                    if (macro.user_id === req.user.id) {
                        const deletedMacro = await macroController.deleteById(Number(req.query.id))

                        if (deletedMacro) {
                            Events.emit('macro-deleted', req.body.socketIdentifier, deletedMacro)
                            res.status(200).json({ macro: deletedMacro })
                        } else {
                            res.status(500).json({ error: 'Internal Server Error' })
                        }
                    } else {
                        res.status(403).json({ error: 'Forbidden' })
                    }
                } else {
                    res.status(404).json({ error: 'Macro not found' })
                }
            } else {
                res.status(400).json({ error: 'Missing parameters' })
            }
        } else {
            res.status(401).json({ error: 'Unauthorized' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

export default router
