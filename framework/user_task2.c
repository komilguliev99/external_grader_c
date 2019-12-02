#include <stdio.h>
#include <stdlib.h>

int		main(void)
{
	int		matrix[100][100];
	int		n, m, i = 0, j = 0;
	int		result = 0;

	scanf("%d", &n);
	scanf("%d", &m);

	for (i = 0; i < n; i++)
		for (j = 0; j < m; j++)
			scanf("%d", &matrix[i][j]);
	for (i = 0; i < n; i++)
		for (j = 0; j < m; j++)
			if (i % 2 == 1 && matrix[i][j] % 2 == 0)
				result += matrix[i][j];		
	printf("%d", result);
	return (0);
}