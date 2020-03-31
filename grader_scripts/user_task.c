#include "stdio.h"

int			main(void)
{
	int			n, x;
	int			a[2000];
	int			i = 0;

	scanf("%d", &n);
	while (i < n)
	{
		scanf("%d", &x);
		a[i] = x;
		if (i % 2 == 0)
			printf("%d ", a[i]);
		i++;
	}
	return (0);
}
