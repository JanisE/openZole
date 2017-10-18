/**
 * The base class of players.
 * (It chooses the first allowed move.)
 */
class Player
{
	constructor (oPlayerInfo)
	{
		// The ID (order letter) of the current game.
		this.sId = undefined;

		// The game state of the current game.
		this.oGameState = undefined;

		this.oPlayerInfo = oPlayerInfo;
	}

	StartGame (sPlayerId)
	{
		// console.log('Player.StartGame(', sPlayerId, '), player = ', this.oPlayerInfo.name);

		this.sId = sPlayerId;
		this.oGameState = new GameState(Zole.GetUnknownZoleDeck());
	}

	/**
	 * @param {UiAdapter} oUi
	 */
	HookUi (oUi)
	{
		// Ignore the UI by default.
	}

	OnStateChange (oLogEntry)
	{
		// console.log('Player ', this.sId, ' is told ', oLogEntry);
		// console.log('Player ', this.sId, ' is told ', JSON.stringify(oLogEntry));

		try {
			this.oGameState.DoActionByLogEntry(oLogEntry);
		}
		catch (oException) {
			console.error('Player ', this.sId, ' complains: ', oException);
		}
	}

	/**
	 * The dummy move maker chooses any (the first found as available) move.
	 * 		Returns undefined if no moves are available.
	 * 		See also "RandomMovesMaker".
	 * @return {Promise}
	 */
	MakeAMove ()
	{
		return new Promise((fResolve) =>
		{
			fResolve(SelectAnySetItem(this.oGameState.GetAllowedActions()));
		});
	}

	GetInfo ()
	{
		return this.oPlayerInfo;
	}
}
