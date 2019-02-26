type Node = string;
type Graph = Map<Node, Node[]>;

type StronglyConnectedComponent = Node[];
type SCC = StronglyConnectedComponent;

/**
 * Identifies strongly connected components in a graph using Tarjan's algorithm
 */
export const tarjan = (graph: Graph): SCC[] => {
	let indexCounter = 0;
	let lowlink: { [node: string]: number } = {};
	let index: { [node: string]: number } = {};
	let stack: Node[] = [];
	let result: SCC[] = [];

	const strongConnect = (node: Node) => {
		index[node] = indexCounter;
		lowlink[node] = indexCounter;
		indexCounter += 1;
		stack.push(node);

		const successors = graph.get(node);

		if (successors === undefined) {
			throw new Error(`A dependency is missing: ${node}`);
		}

		successors.forEach(successor => {
			if (lowlink[successor] === undefined) {
				strongConnect(successor);
				lowlink[node] = Math.min(lowlink[node], lowlink[successor]);
			}
			else if (stack.find(node => node === successor)) {
				lowlink[node] = Math.min(lowlink[node], index[successor]);
			}
		});

		if (lowlink[node] === index[node]) {
			const connectedComponent: SCC = [];

			while (stack.length > 0) {
				const successor = stack.pop();
				if (!successor) { throw new Error('Tarjan stack missing expected node'); }

				connectedComponent.push(successor);

				if (successor === node) { break; }
			}

			result.push(connectedComponent);
		}
	};

	// NOTE: Changing tsconfig *should* allow use of graph.keys() iterator
	graph.forEach((_successors: Node[], node: Node) => {
		if (lowlink[node] === undefined) {
			strongConnect(node);
		}
	});

	return result;
};

export const topologicalSort = (graph: Map<any, any[]>): any[] => {
	// If count for a given node is not found, then it is 0 (use as the default value)
	const count = new Map<any, number>();

	// NOTE: Changing tsconfig *should* allow use of graph.keys() iterator
	graph.forEach((successors = []) => {
		successors.forEach(successor => {
			count.set(successor, ((count.get(successor) || 0) + 1));
		});
	});

	let result: Node[] = [];

	let ready: Node[] = [];
	// NOTE: Changing tsconfig *should* allow use of graph.keys() iterator
	graph.forEach((_successors = [], node) => {
		if ((count.get(node) || 0) === 0) {
			ready.push(node);
		}
	});

	while (ready.length > 0) {
		const node = ready.pop();
		if (node === undefined) { break; }

		result.push(node);

		const successors = graph.get(node);

		if (successors === undefined) {
			throw new Error(`A dependency is missing: ${node}`);
		}

		successors.forEach(successor => {
			count.set(successor, (count.get(successor) || 0) - 1);

			if ((count.get(successor) || 0) === 0) {
				ready.push(successor);
			}
		});
	}

	return result;
};

/** Returns strongly connected components sorted in topological order */
export const robustTopologicalSort = (graph: Graph): Node[][] => {
	const components: SCC[] = tarjan(graph);

	let nodeComponent: { [node: string]: SCC } = {};
	components.forEach((component: SCC) => {
		component.forEach((node: Node) => {
			nodeComponent[node] = component;
		});
	});

	let componentGraph: Map<string[], string[][]> = new Map();
	components.forEach((component: SCC) => {
		componentGraph.set(component, []);
	});

	// NOTE: Changing tsconfig *should* allow use of graph.keys() iterator
	graph.forEach((successors = [], node: Node) => {
		const nodeC: SCC = nodeComponent[node];
		successors.forEach((successor: Node) => {
			const successorC: SCC = nodeComponent[successor];
			if (nodeC !== successorC) {
				const newValue: SCC[] = [ ...(componentGraph.get(nodeC) || []), successorC ];
				componentGraph.set(nodeC, newValue);
			}
		});
	});

	return topologicalSort(componentGraph);
};
