#include <stdio.h>
#include <stdlib.h>

int			main(void)
{
	int		*m;
	int		n, i = 0;

	scanf("%d", &n);
	if (!(m = malloc(sizeof(int) * (n + 1))))
		return (0);
	while (i < n)
		scanf("%d ", &m[i++]);
	i = 0;
	while (i < n)
	{
		printf("%d", m[i]);
		if (i + 2 < n)
			printf(" ");
		i += 2;
	}
	return (0);
}
