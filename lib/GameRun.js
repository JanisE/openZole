function GameRun ()
{
	// All players (three or four) participating in the game run.
	this.aPlayers = [];// An array of Player objects.

	this.oEvent = {};

	this.aGames = [];

	this.oPulesManager = new PulesManager();
}

GameRun.prototype.SetEvent = function GameRun_SetEvent (oEventInfo)
{
	this.oEvent = oEventInfo;
};

GameRun.prototype.SetPlayers = function GameRun_SetPlayers (aPlayers)
{
	this.aPlayers = aPlayers;
};

GameRun.prototype.GetPlayers = function GameRun_GetPlayers ()
{
	return this.aPlayers;
};

GameRun.prototype.AddGame = function GameRun_AddGame (oPlayerOrder, oGameState)
{
	if (! (oGameState instanceof GameState)) {
		throw new Error('GameRun_AddGame: invalid GameState: ', oGameState);
	}

	// TODO Check validity better.
	if (! ('A' in oPlayerOrder) || ! ('B' in oPlayerOrder) || ! ('C' in oPlayerOrder)) {
		throw new Error('GameRun_AddGame: invalid player order: ', oPlayerOrder);
	}

	const oGameChips = oGameState.CalculateGameChips();
	const oPuleChips = this.oPulesManager.NextGame(oGameState, oPlayerOrder);

	const oResult = {
		oChips: {
			A: oGameChips.A + oPuleChips.A,
			B: oGameChips.B + oPuleChips.B,
			C: oGameChips.C + oPuleChips.C
		},
		oDetails: {
			oGameChips,
			oPuleChips
		}
	};

	const oGame = {
		oPlayerOrder: oPlayerOrder,
		oGameState: oGameState,
		oResult: oResult
	};

	this.aGames.push(oGame);

	return oGame;
};

GameRun.prototype.GetGameCount = function GameRun_GetGameCount ()
{
	return this.aGames.length;
};

GameRun.prototype.GetSummaryOfAllGames = function GameRun_Summary ()
{
	const oSummary = {
		oEvent: this.oEvent,
		aPlayerTotals: [],
		aGames: []
	};

	const aPlayerTotals = Array(this.aPlayers.length).fill(0);

	for (const oGame of this.aGames) {
		oSummary.aGames.push({
			mode: oGame.oGameState.sGameMode,
			mode_by: oGame.oGameState.sGameModeBy ? this.aPlayers[oGame.oPlayerOrder[oGame.oGameState.sGameModeBy]].GetInfo().name : undefined,
			chips: [
				{player: this.aPlayers[oGame.oPlayerOrder.A].GetInfo().name, chips: oGame.oResult.oChips.A},
				{player: this.aPlayers[oGame.oPlayerOrder.B].GetInfo().name, chips: oGame.oResult.oChips.B},
				{player: this.aPlayers[oGame.oPlayerOrder.C].GetInfo().name, chips: oGame.oResult.oChips.C}
			]
		});

		aPlayerTotals[oGame.oPlayerOrder.A] += oGame.oResult.oChips.A;
		aPlayerTotals[oGame.oPlayerOrder.B] += oGame.oResult.oChips.B;
		aPlayerTotals[oGame.oPlayerOrder.C] += oGame.oResult.oChips.C;
	}

	for (let iPlayer = 0; iPlayer < this.aPlayers.length; iPlayer++) {
		oSummary.aPlayerTotals.push({
			player: this.aPlayers[iPlayer].GetInfo().name,
			chips: aPlayerTotals[iPlayer]}
		);
	}

	return oSummary;
};

GameRun.prototype.GetTotals = function GameRun_GetTotals ()
{
	const oTotals = this.GetSummaryOfAllGames();

	delete oTotals.aGames;
	oTotals.iGames = this.GetGameCount();

	return oTotals;
};

GameRun.prototype.Export = function GameRun_Export ()
{
	const oGameRunSerialised = {
		oEvent: this.oEvent,
		aPlayers: [],
		aGames: []
	};

	for (const oPlayer of this.aPlayers) {
		oGameRunSerialised.aPlayers.push(oPlayer.GetInfo());
	}

	for (const oGame of this.aGames) {
		oGameRunSerialised.aGames.push({
			oPlayerOrder: oGame.oPlayerOrder,
			oResult: oGame.oResult,
			oGameLog: oGame.oGameState.ExportLog()
		});
	}

	return oGameRunSerialised;
};
