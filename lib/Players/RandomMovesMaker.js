/**
 * Plays cards randomly; chooses the game mode randomly but not with even probabilities (maybe should change this?).
 * @param oPlayerInfo
 */
class RandomMovesMaker extends Player
{
	constructor (oPlayerInfo)
	{
		super(oPlayerInfo);

		this.oPlayerInfo.type = 'robot';
		this.oPlayerInfo.algorithm = 'random';

		if (! this.oPlayerInfo.name) {
			this.oPlayerInfo.name = 'Random Moves Maker';
		}
	}

	MakeAMove ()
	{
		return new Promise((fResolve, fReject) =>
		{
			// Chooses a move randomly.
			const oActions = this.oGameState.GetAllowedActions();
			let oChosenAction = SelectRandomSetItem(oActions);

			// Try harder for a skip?
			if (oChosenAction.action == 'mode') {
				oChosenAction = SelectRandomSetItem(oActions);
			}

			// Try harder to avoid zole?
			if (oChosenAction.action == 'mode' && (oChosenAction.data.mode == 'zole' || oChosenAction.data.mode == 'mazā zole')) {
				oChosenAction = SelectRandomSetItem(oActions);
			}

			// console.log('Player ', this.sId, ' chooses ', oChosenAction,' from ', oActions);
			// console.log('Player ', this.sId, ' chooses ', JSON.stringify(oChosenAction),' from ', oActions);

			if (oActions.size > 0) {
				fResolve(oChosenAction);
				// fResolve(SelectRandomSetItem(oActions));
			}
			else {
				fReject();
			}
		});
	}
}
