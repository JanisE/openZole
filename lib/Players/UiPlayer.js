/**
 * Plays cards as the user selects in the UI.
 * @param oPlayerInfo
 * @constructor
 */
function UiPlayer (oPlayerInfo)
{
	Player.call(this, oPlayerInfo); // Superclass' constructor.

	this.oPlayerInfo.type = 'human';

	if (!this.oPlayerInfo.name) {
		this.oPlayerInfo.name = 'Human Player';
	}

	this.oUi = null;

	this.fWaitingOnUser = null;	// Callback, waiting for an action from the user.
}
UiPlayer.prototype = Object.create(Player.prototype);
UiPlayer.prototype.constructor = RandomMovesMaker;



UiPlayer.prototype.OnCardSelected = function UiPlayer_OnCardSelected (oCard)
{
	if (this.fWaitingOnUser) {
		const oAction = {
			action: 'play',
			data: {
				player: this.sId,
				card: oCard.oCard.sCard
			}
		};

		try {
			this.oGameState.Clone().DoActionByLogEntry(oAction);

			const fCallback = this.fWaitingOnUser;
			// "this.fWaitingOnUser" is also used as a switch, which is safer to be switched off before the callback gets carried out.
			this.fWaitingOnUser = null;
			fCallback(oAction);
		}
		catch (oException) {
			console.log('Illegal move, ignore, keep waiting for a valid one.', oAction, oException);
		}
	}
};

UiPlayer.HandleOnCardSelected = function UiPlayer_HandleOnCardSelected (oEvent, oCard)
{
	oEvent.data.oPlayer.OnCardSelected(oCard);
};

/**
 * @param {UiAdapter} oUi
 */
UiPlayer.prototype.HookUi = function UiPlayer_HookUi (oUi)
{
	if (this.oUi) {
		// Detach from the old UI.
		this.oUi.Off('card_selected', {oPlayer: this}, UiPlayer.HandleOnCardSelected);
	}

	this.oUi = oUi;
	this.oUi.On('card_selected', {oPlayer: this}, UiPlayer.HandleOnCardSelected);
};

UiPlayer.prototype.MakeAMove = function UiPlayer_MakeAMove ()
{
	return new Promise((fResolve, fReject) =>
	{
		if (this.oGameState.GetAllowedPlayCardActions().size > 0) {
			// Wait for the user to choose.
			this.fWaitingOnUser = fResolve;
		}
		else {
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

			if (oActions.size > 0) {
				fResolve(oChosenAction);
			}
			else {
				fReject();
			}
		}
	});
};
