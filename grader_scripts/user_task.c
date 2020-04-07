#include <stdio.h>

int         main(void)
{
    int     a[1000][1000];
    int     n, m, x, i, j;
    float     amg = 0, cnt = 0;

    scanf("%d", &n);
    scanf("%d", &m);
    i = 0;
    while (i < n)
    {
        j = 0;
        while (j < m)
        {
            scanf("%d", &x);
            a[i][j] = x;
            if (i % 2 == 1 && x % 2 == 0)
            {
                amg += x;
                cnt++;
            }
            j++;
        }
        i++;
    }

    printf("%f", amg / cnt);
}