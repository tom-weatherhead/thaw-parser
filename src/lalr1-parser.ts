// lalr1-parser.ts

// import { IEqualityComparable, Set, Stack } from 'thaw-common-utilities.ts';
//
// import { Token } from 'thaw-lexical-analyzer';
//
// import { GrammarException, IGrammar, Production, Symbol } from 'thaw-grammar';
//
// import { LR0Configuration, ShiftReduceAction } from './lr0-parser';

// #region LALR1Configuration

/* eslint-disable @typescript-eslint/ban-types */

// export class LALR1Configuration extends LR0Configuration {
// 	public readonly HashSet<Symbol> Lookaheads = new HashSet<Symbol>();
// 	public readonly HashSet<LALR1Configuration> PropagateLinks = new HashSet<LALR1Configuration>();
//
// 	public LALR1Configuration(Symbol lhs, Symbol look)
// 		: base(lhs)
// 	{
// 		Lookaheads.Add(look);
// 	}
//
// 	public LALR1Configuration(Symbol lhs, HashSet<Symbol> looks)
// 		: base(lhs)
// 	{
// 		Lookaheads.UnionWith(looks);
// 	}
//
// 	public LALR1Configuration(LR0Configuration src, HashSet<Symbol> looks)
// 		: base(src)
// 	{
// 		Lookaheads.UnionWith(looks);
// 	}
//
// 	public LALR1Configuration(Production p, Symbol look)
// 		: base(p)
// 	{
// 		Lookaheads.Add(look);
// 	}
//
// 	public static LALR1Configuration Create(LR1Configuration c)
// 	{
// 		var result = new LALR1Configuration(c.ProductionLHS, c.Lookahead);
//
// 		result.ProductionRHS.AddRange(c.ProductionRHS);
// 		return result;
// 	}
//
// 	public override bool Equals(object obj)
// 	{
//
// 		if (object.ReferenceEquals(this, obj))
// 		{
// 			return true;
// 		}
//
// 		var thatBase = obj as LR0Configuration;
// 		var that = obj as LALR1Configuration;
//
// 		return base.Equals(thatBase) && that != null && Lookaheads.IsSubsetOf(that.Lookaheads) && that.Lookaheads.IsSubsetOf(Lookaheads);
// 	}
//
// 	public override int GetHashCode()
// 	{
// 		/*
// 		int hashCode = base.GetHashCode() * 103;
//
// 		foreach (Symbol symbol in Lookaheads)
// 		{
// 			hashCode += symbol.GetHashCode();   // The order of the lookahead symbols does not alter the hash code.
// 		}
//
// 		return hashCode;
// 		 */
//
// 		// The order of the lookahead symbols does not alter the hash code.
// 		return Lookaheads
// 			.Select(symbol => symbol.GetHashCode())
// 			.Aggregate(base.GetHashCode() * 103, (accumulator, hashCode) => accumulator + hashCode);
// 	}
//
// 	// The "new" keyword is used here because this function hides a function in the base class which differs only by return type.
//
// 	public new LALR1Configuration AdvanceDot()
// 	{
// 		return new LALR1Configuration(base.AdvanceDot(), Lookaheads);
// 	}
//
// 	public LR0Configuration ToLR0Configuration()    // Unit tests show that this is necessary.
// 	{
// 		return new LR0Configuration(ProductionLHS, ProductionRHS);
// 	}
// }
//
// #endregion
//
// #region LALR1CFSMState
//
// class LALR1CFSMState
// {
// 	public readonly HashSet<LALR1Configuration> ConfigurationSet;
// 	public readonly Dictionary<Symbol, LALR1CFSMState> Transitions = new Dictionary<Symbol, LALR1CFSMState>();
//
// 	public LALR1CFSMState(HashSet<LALR1Configuration> cs)
// 	{
// 		ConfigurationSet = cs;
// 	}
//
// 	public override bool Equals(object obj)
// 	{
// 		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
//
// 		if (object.ReferenceEquals(this, obj))
// 		{
// 			return true;
// 		}
//
// 		var that = obj as LALR1CFSMState;
//
// 		// TODO: Should we also consider Transitions.Keys?
// 		return that != null && ConfigurationSet.IsSubsetOf(that.ConfigurationSet) && that.ConfigurationSet.IsSubsetOf(ConfigurationSet);
// 	}
//
// 	public override int GetHashCode()
// 	{
// 		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
// 		/*
// 		int hashCode = 0;
//
// 		foreach (LALR1Configuration conf in ConfigurationSet)
// 		{
// 			// The order of the configurations in the set doesn't affect the hash code.
// 			hashCode += conf.GetHashCode();
// 		}
//
// 		// TODO: Should we also consider Transitions.Keys?
// 		return hashCode;
// 		 */
// 		return ConfigurationSet
// 			.Select(conf => conf.GetHashCode())
// 			.Aggregate(0, (accumulator, hashCode) => accumulator + hashCode);
// 	}
// }
//
// #endregion
//
// #region LALR1CFSM
//
// class LALR1CFSM
// {
// 	public readonly List<LALR1CFSMState> StateList = new List<LALR1CFSMState>();
// 	public readonly LALR1CFSMState StartState;
//
// 	public LALR1CFSM(LALR1CFSMState ss)
// 	{
// 		StartState = ss;
// 		StateList.Add(ss);
// 	}
//
// 	public LALR1CFSMState FindStateWithLabel(HashSet<LALR1Configuration> cs)
// 	{
//
// 		foreach (var state in StateList)
// 		{
//
// 			if (cs.IsSubsetOf(state.ConfigurationSet) &&
// 				state.ConfigurationSet.IsSubsetOf(cs))
// 			{
// 				return state;
// 			}
// 		}
//
// 		throw new InternalErrorException(string.Format("LALR1CFSM.FindStateWithLabel() : No matching state found; label size == {0}.", cs.Count));
// 	}
// }
//
// #endregion
//
// #region LALR1StateSymbolPair
//
// class LALR1StateSymbolPair
// {
// 	public readonly LALR1CFSMState state;
// 	public readonly Symbol symbol;
//
// 	public LALR1StateSymbolPair(LALR1CFSMState st, Symbol sy)
// 	{
// 		state = st;
// 		symbol = sy;
// 	}
//
// 	public override bool Equals(object obj)
// 	{
//
// 		if (object.ReferenceEquals(this, obj))
// 		{
// 			return true;
// 		}
//
// 		var that = obj as LALR1StateSymbolPair;
//
// 		return that != null && state.Equals(that.state) && symbol == that.symbol;
// 	}
//
// 	public override int GetHashCode()
// 	{
// 		return state.GetHashCode() * 101 + symbol.GetHashCode();
// 	}
// }
//
// #endregion
//
// #region LookaheadPropagationRecord
//
// class LookaheadPropagationRecord
// {
// 	public readonly LALR1Configuration configuration;
// 	public readonly Symbol lookahead;
//
// 	public LookaheadPropagationRecord(LALR1Configuration c, Symbol l)
// 	{
// 		configuration = c;
// 		lookahead = l;
// 	}
// }
//
// #endregion
//
// #region LALR1Parser
//
// public class LALR1Parser : LR0Parser
// {
// 	private readonly Dictionary<CFSMState, HashSet<LALR1Configuration>> cognateDict = new Dictionary<CFSMState, HashSet<LALR1Configuration>>();
//
// 	public LALR1Parser(IGrammar g)
// 		: base(g)
// 	{
// 		BuildLALR1CFSM();
// 	}
//
// 	public LALR1Parser(GrammarSelector gs)
// 		: this(GrammarFactory.Create(gs))
// 	{
// 	}
//
// 	// See Fischer and LeBlanc, page 167.
//
// 	private HashSet<LR0Configuration> Core(HashSet<LALR1Configuration> s)
// 	{
// 		var result = new HashSet<LR0Configuration>();
//
// 		foreach (var c in s)
// 		{
// 			result.Add(c.ToLR0Configuration());
// 		}
//
// 		return result;
// 	}
//
// 	private void CognateHelper(HashSet<LALR1Configuration> s, HashSet<LALR1Configuration> cognateResult,
// 		Dictionary<LR0Configuration, LALR1Configuration> configDict)
// 	{
//
// 		foreach (var c in s)
// 		{
// 			var lr0Config = c.ToLR0Configuration();
//
// 			if (configDict.ContainsKey(lr0Config))
// 			{
// 				var c2 = configDict[lr0Config];
//
// 				if (!c.Lookaheads.IsSubsetOf(c2.Lookaheads))
// 				{
// 					// Note: This probably changes the hash code of c2; cognateResult may need to be rehashed, if possible.
// 					// A better solution: Remove c2 from cognateResult before modifying c2, and re-add it afterwards:
// 					cognateResult.Remove(c2);
// 					c2.Lookaheads.UnionWith(c.Lookaheads);
// 					cognateResult.Add(c2);
// 				}
// 			}
// 			else
// 			{
// 				cognateResult.Add(c);
// 				configDict[lr0Config] = c;
// 			}
// 		}
// 	}
//
// 	// See Fischer and LeBlanc, page 167.
//
// 	private HashSet<LALR1Configuration> Cognate(HashSet<LR0Configuration> s_bar, List<HashSet<LALR1Configuration>> stateList)
// 	{
// 		var result = new HashSet<LALR1Configuration>();
// 		var configDict = new Dictionary<LR0Configuration, LALR1Configuration>();
//
// 		foreach (var s in stateList)
// 		{
// 			var s_core = Core(s);
//
// 			if (!s_bar.IsSubsetOf(s_core) || !s_core.IsSubsetOf(s_bar))
// 			{
// 				continue;
// 			}
//
// 			// Solution 1:
// 			//result.UnionWith(s);    // Question: Could this inadvertently cause result to contain multiple configurations that differ only by lookahead?
//
// 			// Solution 2:
// 			CognateHelper(s, result, configDict);
// 		}
//
// 		return result;
// 	}
//
// 	private HashSet<LALR1Configuration> Cognate(CFSMState s_bar, LALR1CFSM lalr1machine)
// 	{
// 		var result = new HashSet<LALR1Configuration>();
// 		var configDict = new Dictionary<LR0Configuration, LALR1Configuration>();
//
// 		foreach (var s in lalr1machine.StateList)
// 		{
// 			var s_core = Core(s.ConfigurationSet);
//
// 			if (!s_bar.ConfigurationSet.IsSubsetOf(s_core) || !s_core.IsSubsetOf(s_bar.ConfigurationSet))
// 			{
// 				continue;
// 			}
//
// 			// Solution 1:
// 			//result.UnionWith(s.ConfigurationSet);    // Question: Could this inadvertently cause result to contain multiple configurations that differ only by lookahead?
//
// 			// Solution 2:
// 			CognateHelper(s.ConfigurationSet, result, configDict);
// 		}
//
// 		return result;
// 	}
//
// 	private void BuildLALR1CFSM()
// 	{
// 		// 1) Create the machine object with all of its states.
// 		// See Fischer and LeBlanc, page 167.
//
// 		// 1a) Create the start state so that the machine object can be created.
// 		var stateList = new List<HashSet<LALR1Configuration>>();
// 		var lr1parser = new LR1Parser(grammar);
//
// 		foreach (var lr1State in lr1parser.machine.StateList)
// 		{
// 			var cs = new HashSet<LALR1Configuration>();
//
// 			foreach (var c in lr1State.ConfigurationSet)
// 			{
// 				cs.Add(LALR1Configuration.Create(c));
// 			}
//
// 			stateList.Add(cs);
// 		}
//
// 		foreach (var lr0state in machine.StateList)
// 		{
// 			cognateDict[lr0state] = Cognate(lr0state.ConfigurationSet, stateList);
// 		}
//
// 		var startState = new LALR1CFSMState(cognateDict[machine.StartState]);
// 		var result = new LALR1CFSM(startState);
//
// 		// 1b) Create the other states.
//
// 		foreach (var lr0state in machine.StateList)
// 		{
// 			var lalr1State = new LALR1CFSMState(cognateDict[lr0state]);
//
// 			if (!result.StateList.Contains(lalr1State))
// 			{
// 				result.StateList.Add(lalr1State);
// 			}
// 		}
//
// 		// 2) Add the transitions.
//
// 		foreach (var lr0state in machine.StateList)
// 		{
// 			var lalr1State = result.FindStateWithLabel(cognateDict[lr0state]);
//
// 			foreach (var symbol in lr0state.Transitions.Keys)
// 			{
// 				var lalr1StateDest = result.FindStateWithLabel(cognateDict[lr0state.Transitions[symbol]]);
//
// 				lalr1State.Transitions[symbol] = lalr1StateDest;
// 			}
// 		}
//
// 		// 3) Add the lookaheads.
// 		// See Fischer and LeBlanc, pages 171-173.
//
// 		foreach (var s in result.StateList)
// 		{
//
// 			foreach (var c in s.ConfigurationSet)
// 			{
// 				c.Lookaheads.Clear();   // Test; hack.  The real lookahead symbols will be added below.
// 			}
// 		}
//
// 		// 3a) Create the propagate links between configurations:
// 		//   i) When one configuration is created from another in a previous state via a shift operation.
//
// 		foreach (var s in result.StateList)
// 		{
//
// 			foreach (var c in s.ConfigurationSet)
// 			{
// 				Symbol symbol;
//
// 				if (!c.FindSymbolAfterDot(out symbol) || !s.Transitions.ContainsKey(symbol))
// 				{
// 					continue;
// 				}
//
// 				var nextState = s.Transitions[symbol];
// 				var configurationToMatch = c.AdvanceDot();
//
// 				foreach (var cNext in nextState.ConfigurationSet)
// 				{
//
// 					if (cNext.Equals(configurationToMatch))
// 					{
// 						c.PropagateLinks.Add(cNext);
// 						break;
// 					}
// 				}
// 			}
// 		}
//
// 		//   ii) When a configuration is created as a result of a closure or prediction operation on another configuration.
// 		//     - A -> dot alpha, L2; B -> beta dot A gamma, L1
// 		//       - ThAW note: It appears that these two configurations will always be in the same state if the first conf results from the closure of the second.
// 		//         ? Is this also true in the case of prediction?
// 		//     1) Spontaneous: L2 = First(gamma), which does not include lambda.
// 		//     2) Propagate: When gamma can derive lambda.
//
// 		foreach (var s in result.StateList)
// 		{
//
// 			foreach (var c in s.ConfigurationSet)
// 			{
// 				Symbol symbol;
//
// 				if (!c.FindSymbolAfterDot(out symbol))
// 				{
// 					continue;
// 				}
//
// 				foreach (var cNext in s.ConfigurationSet)
// 				{
//
// 					if (cNext.ProductionLHS != symbol || cNext.FindDot() != 0)
// 					{
// 						continue;
// 					}
//
// 					// cNext is of the form "A -> dot alpha", where A == symbol.
//
// 					var gamma = c.FindSuffix(1);
// 					var firstOfGamma = ComputeFirst(gamma);
// 					var gammaCanDeriveLambda = firstOfGamma.Contains(Symbol.Lambda);
//
// 					if (gammaCanDeriveLambda)
// 					{
// 						// Propagate (adjective) lookaheads.
// 						c.PropagateLinks.Add(cNext);
//
// 						// Should we also add the non-lambda members of firstOfGamma to cNext.Lookaheads?
// 						firstOfGamma.Remove(Symbol.Lambda);
// 					}
//
// 					cNext.Lookaheads.UnionWith(firstOfGamma);   // Add spontaneous lookaheads.
// 				}
// 			}
// 		}
//
// 		// 3b) Add the spontaneous lookaheads: the non-lambda values of First(gamma). : Done above.
// 		//  - Also initialize the lookahead set of the initial configuration to the empty set. : Done by default.
//
// 		// 3c) Propagate the lookaheads.
// 		var lookaheadPropagationStack = new Stack<LookaheadPropagationRecord>();
//
// 		foreach (var s in result.StateList)
// 		{
//
// 			foreach (var c in s.ConfigurationSet)
// 			{
//
// 				foreach (var l in c.Lookaheads)
// 				{
// 					lookaheadPropagationStack.Push(new LookaheadPropagationRecord(c, l));
// 				}
// 			}
// 		}
//
// 		while (lookaheadPropagationStack.Count > 0)
// 		{
// 			var lpr = lookaheadPropagationStack.Pop();
//
// 			foreach (var cLinked in lpr.configuration.PropagateLinks)
// 			{
//
// 				if (!cLinked.Lookaheads.Contains(lpr.lookahead))
// 				{
// 					cLinked.Lookaheads.Add(lpr.lookahead);
// 					lookaheadPropagationStack.Push(new LookaheadPropagationRecord(cLinked, lpr.lookahead));
// 				}
// 			}
// 		}
//
// 		// Clear cognateDict and re-populate it with configurations from the newly created LALR(1) machine
// 		// in order to ensure that the values of cognateDict contain all of the correct lookaheads?
//
// 		cognateDict.Clear();
//
// 		foreach (var lr0state in machine.StateList)
// 		{
// 			cognateDict[lr0state] = Cognate(lr0state, result);
// 		}
// 	}
//
// 	// Adapted from Fischer and LeBlanc, pages 167-168.
//
// 	private ShiftReduceAction GetAction(CFSMState S, Symbol tokenAsSymbol, out int reduceProductionNum)
// 	{
// 		var result = ShiftReduceAction.Error;
// 		var reduceResultFound = false;   // In order for the grammar to be LALR(1), there must be at most one result per state-symbol pair.
//
// 		reduceProductionNum = -1;
//
// 		// 1) Search for Reduce actions.
// 		var cognateS = cognateDict[S];
//
// 		foreach (var c in cognateS)
// 		{
//
// 			if (!c.Lookaheads.Contains(tokenAsSymbol))
// 			{
// 				continue;
// 			}
//
// 			var matchedProduction = c.ConvertToProductionIfAllMatched();
//
// 			if (matchedProduction == null)
// 			{
// 				continue;
// 			}
//
// 			for (var i = 0; i < grammar.Productions.Count; ++i)
// 			{
// 				var productionToCompare = grammar.Productions[i].StripOutSemanticActions();
//
// 				if (matchedProduction.Equals(productionToCompare))
// 				{
//
// 					if (reduceResultFound && reduceProductionNum != i)
// 					{
// 						throw new ReduceReduceConflictException(string.Format(
// 							"GetAction() : Multiple actions found: productions {0} and {1}; grammar is not LALR(1).",
// 							grammar.Productions[reduceProductionNum], grammar.Productions[i]));
// 					}
//
// 					result = ShiftReduceAction.Reduce;
// 					reduceProductionNum = i;
// 					reduceResultFound = true;
// 				}
// 			}
// 		}
//
// 		// 2) Search for Shift and Accept actions.
// 		Symbol symbol;
// 		bool shiftOrAcceptResultFound = S.ConfigurationSet.Any(c => c.FindSymbolAfterDot(out symbol) && symbol == tokenAsSymbol);
//
// 		if (shiftOrAcceptResultFound)
// 		{
//
// 			if (reduceResultFound)
// 			{
// 				var configurationToShift = S.ConfigurationSet.First(c => c.FindSymbolAfterDot(out symbol) && symbol == tokenAsSymbol);
//
// 				throw new ShiftReduceConflictException(string.Format(
// 					"GetAction() : Multiple actions found: shift: {0}; reduce: {1}; grammar is not LALR(1).",
// 					configurationToShift, grammar.Productions[reduceProductionNum]));
// 			}
//
// 			result = (tokenAsSymbol == Symbol.T_EOF) ? ShiftReduceAction.Accept : ShiftReduceAction.Shift;
// 		}
//
// 		return result;
// 	}
//
// 	protected override ShiftReduceAction GetActionCaller(CFSMState S, Symbol tokenAsSymbol, out int reduceProductionNum)
// 	{
// 		return GetAction(S, tokenAsSymbol, out reduceProductionNum);
// 	}
// }

// #endregion

/* eslint-enable @typescript-eslint/ban-types */
