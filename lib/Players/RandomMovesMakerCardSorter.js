/**
 * Same as RandomMovesMaker, but sorts hand cards by strength.
 */
class RandomMovesMakerCardSorter extends RandomMovesMaker
{
	constructor (oPlayerInfo)
	{
		super(oPlayerInfo);

		if (! this.oPlayerInfo.name) {
			this.oPlayerInfo.name = 'Random Moves Maker - Card Sorter';
		}

		this.oUi = null;
	}

	/**
	 * @param {UiAdapter} oUi
	 */
	HookUi (oUi)
	{
		this.oUi = oUi;
	}

	OnStateChange (oLogEntry)
	{
		super.OnStateChange(oLogEntry);

		if (
			// Sort the cards...
			// ... upon receiving all the initial eight cards,
			(oLogEntry.action == 'deal' && oLogEntry.data.player == this.sId && this.oGameState.oHands[this.sId].Size() >= 8)
			// ... and after taking the talon.
			|| (oLogEntry.action == 'mode' && oLogEntry.data.player == this.sId && oLogEntry.data.mode == 'augšā')
		) {
			// TODO Others must not see which cards get discarded.
			// TODO Take the promise into consideration. Busy queue?
			this.oUi.SortCards(this.sId);
		}
	}
}
