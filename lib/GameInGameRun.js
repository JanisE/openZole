class GameInGameRun
{
	/**
	 * @param {{oPlayerOrder: PlayerOrder, oGameState: GameState, oResult: {oChips: {A: int, B: int, C: int}, oDetails: {oGameChips, oPuleChips: Object}}}}
	 */
	constructor ({oPlayerOrder, oGameState, oResult})
	{
		this.oPlayerOrder = oPlayerOrder;
		this.oGameState = oGameState;
		this.oResult = oResult;
	}

	Clone ()
	{
		return new GameInGameRun({
			oPlayerOrder: this.oPlayerOrder.Clone(),
			oGameState: this.oGameState.Clone(),
			oResult: _.cloneDeep(this.oResult)
		});
	}

	Export ()
	{
		return {
			oPlayerOrder: this.oPlayerOrder.Export(),
			oResult: this.oResult,
			oGameLog: this.oGameState.ExportLog()
		}
	}
}